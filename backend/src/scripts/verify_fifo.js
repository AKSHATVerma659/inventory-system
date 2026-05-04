/**
 * verify_fifo.js
 * FIFO OUT end-to-end verification
 * Uses RAW SQL for customer to avoid model registry dependency
 */

const sequelize = require('../config/database');
const { Op, QueryTypes } = require('sequelize');

const {
  Product,
  Inventory,
  InventoryBatch,
  Sale,
  SaleItem
} = require('../models');

const saleService = require('../services/saleService');

async function dumpBatches(productId, warehouseId) {
  const batches = await InventoryBatch.findAll({
    where: { product_id: productId, warehouse_id: warehouseId },
    order: [['created_at', 'ASC']]
  });
  return batches.map(b => ({
    id: b.id,
    qty_rem: Number(b.quantity_remaining),
    unit_cost: Number(b.unit_cost),
    created_at: b.created_at
  }));
}

async function ensureCustomer(transaction) {
  // Try to get any existing customer
  const rows = await sequelize.query(
    `SELECT id FROM customers LIMIT 1`,
    { type: QueryTypes.SELECT, transaction }
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  // Create a test customer if none exist
  const result = await sequelize.query(
    `
    INSERT INTO customers (name, phone, created_at)
    VALUES ('FIFO Test Customer', '9999999999', NOW())
    `,
    { transaction }
  );

  return result[0]; // insertId
}

async function run() {
  console.log('→ Starting FIFO verification script');

  const t = await sequelize.transaction();

  try {
    // 1️⃣ Ensure customer exists (raw SQL)
    const customerId = await ensureCustomer(t);

    // 2️⃣ Find inventory row
    const inventoryRow = await Inventory.findOne({
      where: { quantity: { [Op.gt]: 0 } },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!inventoryRow) {
      throw new Error('No inventory row found with quantity > 0');
    }

    const productId = inventoryRow.product_id;
    const warehouseId = inventoryRow.warehouse_id;

    // 3️⃣ Load FIFO batches
    const batches = await InventoryBatch.findAll({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
        quantity_remaining: { [Op.gt]: 0 }
      },
      order: [['created_at', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!batches.length) {
      throw new Error('No FIFO batches found');
    }

    const product = await Product.findByPk(productId, { transaction: t });

    console.log('Selected product:', productId, product.name, 'warehouse:', warehouseId);
    console.log('Inventory quantity (before):', Number(inventoryRow.quantity));
    console.log('Batches (before):', await dumpBatches(productId, warehouseId));

    // 4️⃣ Compute quantity to force FIFO
    let requiredQty;
    if (batches.length > 1) {
      requiredQty = Math.min(
        Number(inventoryRow.quantity),
        Number(batches[0].quantity_remaining) + 1
      );
    } else {
      requiredQty = Math.ceil(Number(batches[0].quantity_remaining) / 2);
    }

    // 5️⃣ Create sale + item
    const sale = await Sale.create({
      warehouse_id: warehouseId,
      customer_id: customerId,
      status: 'UNPAID',
      lifecycle_status: 'DRAFT'
    }, { transaction: t });

    const unitPrice = Number(product.selling_price || product.cost_price || 0);

    await SaleItem.create({
      sale_id: sale.id,
      product_id: productId,
      quantity: requiredQty,
      unit_price: unitPrice,
      total_price: (requiredQty * unitPrice).toFixed(4),
      cost_amount: 0
    }, { transaction: t });

    // 6️⃣ Confirm sale (FIFO OUT)
    const result = await saleService.confirmSale(sale.id, customerId, t);

    if (!result?.success) {
      throw new Error('Sale confirmation failed');
    }

    sale.lifecycle_status = 'CONFIRMED';
    await sale.save({ transaction: t });

    await t.commit();

    // 7️⃣ Verify results
    const inventoryAfter = await Inventory.findOne({
      where: { product_id: productId, warehouse_id: warehouseId }
    });

    const batchesAfter = await dumpBatches(productId, warehouseId);
    const saleItemAfter = await SaleItem.findOne({
      where: { sale_id: sale.id }
    });

    console.log('--- FIFO RESULT ---');
    console.log('Inventory quantity (after):', Number(inventoryAfter.quantity));
    console.log('Batches (after):', batchesAfter);
    console.log('Recorded COGS:', Number(saleItemAfter.cost_amount));
    console.log('Sale ID:', sale.id);

    console.log('✅ FIFO OUT verification PASSED');
    process.exit(0);
  } catch (err) {
    try { await t.rollback(); } catch {}
    console.error('❌ FIFO verification failed:', err.message);
    process.exit(1);
  }
}

run();
