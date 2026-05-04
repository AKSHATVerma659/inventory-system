'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    /* ============================
       0️⃣ ENSURE CUSTOMER EXISTS
    ============================ */
    const [customers] = await queryInterface.sequelize.query(
      `SELECT id FROM customers ORDER BY id LIMIT 1`
    );

    let customerId;
    if (!customers.length) {
      // create a default customer (B2B-capable)
      const [custInsert] = await queryInterface.bulkInsert(
        'customers',
        [{
          name: 'Default Customer',
          email: 'customer@example.com',
          phone: '9999999999',
          gstin: '27ABCDE1234F1Z5',
          created_at: now
        }]
      );
      // bulkInsert may return insertId or the number; fetch the row to be safe
      const [[createdCustomer]] = await queryInterface.sequelize.query(
        `SELECT id FROM customers WHERE email = :email LIMIT 1`,
        { replacements: { email: 'customer@example.com' }, type: Sequelize.QueryTypes.SELECT }
      ).then(r => [r]);
      customerId = createdCustomer ? createdCustomer.id : custInsert;
    } else {
      customerId = customers[0].id;
    }

    /* ============================
       1️⃣ FETCH PRODUCTS & WAREHOUSE
    ============================ */
    const [products] = await queryInterface.sequelize.query(
      `
      SELECT
        p.id,
        p.selling_price,
        p.gst_rate
      FROM products p
      ORDER BY p.id
      LIMIT 3
      `
    );

    const [warehouses] = await queryInterface.sequelize.query(
      `SELECT id FROM warehouses ORDER BY id LIMIT 1`
    );

    if (!products.length || !warehouses.length) {
      throw new Error('Products or Warehouses missing.');
    }

    const warehouseId = warehouses[0].id;

    /* ============================
       2️⃣ BUILD SALE ITEMS
    ============================ */
    let taxableValue = 0;
    const saleItemsPayload = products.map((p, idx) => {
      const qty = 5 + idx * 2;
      const rate = Number(p.selling_price || 0);
      const lineTotal = qty * rate;
      taxableValue += lineTotal;

      return {
        product_id: p.id,
        quantity: qty,
        unit_price: rate,
        total_price: lineTotal,
        cost_amount: 0, // set during FIFO consume
        created_at: now
      };
    });

    /* ============================
       3️⃣ GST CALCULATION (DB OWNED)
    ============================ */
    // For seeder simplicity we compute GST from first product's gst_rate if present
    const gstRate = Number(products[0].gst_rate || 0);
    const taxAmount = Math.round((taxableValue * gstRate) * 100) / 100 / 100 * 100; // safe rounding
    // simpler, avoid floating weirdness:
    const taxAmtExact = (taxableValue * gstRate) / 100;
    const cgst = Math.round((taxAmtExact / 2) * 100) / 100;
    const sgst = Math.round((taxAmtExact / 2) * 100) / 100;
    const igst = 0;
    const totalAmount = Math.round((taxableValue + taxAmtExact) * 100) / 100;

    /* ============================
       4️⃣ CREATE SALE (DRAFT → then confirm)
    ============================ */
    await queryInterface.bulkInsert(
      'sales',
      [{
        customer_id: customerId,
        warehouse_id: warehouseId,
        invoice_no: 'INV-SEED-001',
        subtotal: taxableValue,
        taxable_value: taxableValue,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        tax_amount: taxAmtExact,
        total_amount: totalAmount,
        paid_amount: 0,
        customer_gstin: '27ABCDE1234F1Z5',
        place_of_supply: 'Maharashtra',
        is_interstate: false,
        status: 'UNPAID',
        lifecycle_status: 'DRAFT',
        created_at: now
      }]
    );

    // fetch the sale id reliably
    const [[saleRow]] = await queryInterface.sequelize.query(
      `SELECT id FROM sales WHERE invoice_no = :invoice_no LIMIT 1`,
      { replacements: { invoice_no: 'INV-SEED-001' }, type: Sequelize.QueryTypes.SELECT }
    ).then(r => [r]);

    const saleId = saleRow?.id;
    if (!saleId) throw new Error('Failed to create sale during seeding.');

    /* ============================
       5️⃣ INSERT SALE ITEMS (linked to sale)
    ============================ */
    await queryInterface.bulkInsert(
      'sale_items',
      saleItemsPayload.map(item => ({
        ...item,
        sale_id: saleId
      }))
    );

    /* ============================
       6️⃣ CONFIRM SALE — FIFO OUT (per item)
    ============================ */

    for (const item of saleItemsPayload) {
      let remaining = item.quantity;
      let totalCostForLine = 0;

      // fetch batches for this product at the warehouse, ordered FIFO
      const [batches] = await queryInterface.sequelize.query(
        `
        SELECT id, quantity_remaining, unit_cost
        FROM inventory_batches
        WHERE product_id = :productId
          AND warehouse_id = :warehouseId
          AND quantity_remaining > 0
        ORDER BY created_at ASC
        `,
        { replacements: { productId: item.product_id, warehouseId }, type: Sequelize.QueryTypes.SELECT }
      );

      for (const batch of batches) {
        if (remaining <= 0) break;
        const available = Number(batch.quantity_remaining);
        if (available <= 0) continue;

        const consumeQty = Math.min(available, remaining);
        const costChunk = consumeQty * Number(batch.unit_cost);
        totalCostForLine += costChunk;

        // update batch quantity_remaining
        await queryInterface.bulkUpdate(
          'inventory_batches',
          { quantity_remaining: Number(available - consumeQty) },
          { id: batch.id }
        );

        remaining -= consumeQty;
      }

      if (remaining > 0) {
        throw new Error(`Insufficient FIFO stock for product ${item.product_id}`);
      }

      // set cost_amount on sale_item
      await queryInterface.bulkUpdate(
        'sale_items',
        { cost_amount: Math.round(totalCostForLine * 100) / 100 },
        {
          sale_id: saleId,
          product_id: item.product_id
        }
      );

      // decrement inventory snapshot
      await queryInterface.sequelize.query(
        `
        UPDATE inventory
        SET quantity = quantity - :qty
        WHERE product_id = :productId AND warehouse_id = :warehouseId
        `,
        { replacements: { qty: item.quantity, productId: item.product_id, warehouseId } }
      );

      // ledger
      await queryInterface.bulkInsert('stock_movements', [{
        product_id: item.product_id,
        warehouse_id: warehouseId,
        change: -item.quantity,
        movement_type: 'OUT',
        reference_type: 'SALE',
        reference_id: saleId,
        reason: 'SALE_SEED',
        created_at: now
      }]);
    }

    /* ============================
       7️⃣ FINALIZE SALE
    ============================ */
    await queryInterface.bulkUpdate(
      'sales',
      { lifecycle_status: 'CONFIRMED' },
      { id: saleId }
    );

    console.log('✅ Sales seeded successfully (INV-SEED-001)');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_movements', { reason: 'SALE_SEED' });
    await queryInterface.bulkDelete('sale_items', null);
    await queryInterface.bulkDelete('sales', { invoice_no: 'INV-SEED-001' });
  }
};
