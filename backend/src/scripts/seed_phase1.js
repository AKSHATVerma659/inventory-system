/**
 * seed_phase1.js
 *
 * Run:
 *   node src/scripts/seed_phase1.js
 */

const path = require('path');
const { Op } = require('sequelize');

async function run() {
  console.log('→ Starting seed_phase1: building demo data (Phase-1)');

  const modelsPath = path.join(__dirname, '..', 'models');
  const {
    sequelize,
    Product,
    Warehouse,
    Purchase,
    PurchaseItem,
    InventoryBatch,
    StockMovement,
    Sale,
    SaleItem,
    Customer,
    Supplier,
    Payment
  } = require(modelsPath);

  await sequelize.authenticate();
  console.log('DB connection OK');

  /* =========================
     SAFETY GUARD (CORRECT ONE)
  ========================= */
  const existingPurchaseItems = await PurchaseItem.count();
  if (existingPurchaseItems > 0) {
    console.log('⚠️ Phase-1 data already exists. Skipping seeding safely.');
    process.exit(0);
  }

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const states = ['Maharashtra','Karnataka','Delhi','Tamil Nadu','Gujarat','Rajasthan'];

  const t = await sequelize.transaction();

  try {
    /* =========================
       HELPER: NEXT INVOICE NO
    ========================= */
    async function getNextInvoiceNo(transaction) {
      const [rows] = await sequelize.query(
        `SELECT invoice_no FROM sales WHERE invoice_no IS NOT NULL ORDER BY id DESC LIMIT 1`,
        { transaction }
      );

      if (!rows.length) return `INV-2026-00001`;

      const last = rows[0].invoice_no;
      const num = parseInt(last.split('-')[2], 10) + 1;
      return `INV-2026-${String(num).padStart(5, '0')}`;
    }

    /* =========================
       CUSTOMERS
    ========================= */
    const customerRows = [];
    for (let i = 1; i <= 20; i++) {
      customerRows.push({
        name: `Customer ${i}`,
        email: `customer${i}@mail.com`,
        gstin: `27ABCDE${String(i).padStart(4,'0')}F1Z5`,
        place_of_supply: sample(states),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    await Customer.bulkCreate(customerRows, { transaction: t });
    const customers = await Customer.findAll({ transaction: t });
    console.log('Customers seeded');

    /* =========================
       SUPPLIERS
    ========================= */
    const supplierRows = [];
    for (let i = 1; i <= 10; i++) {
      supplierRows.push({
        name: `Supplier ${i}`,
        email: `supplier${i}@mail.com`,
        phone: `9${rand(100000000,999999999)}`,
        address: `Industrial Area ${i}`,
        created_at: new Date()
      });
    }
    await Supplier.bulkCreate(supplierRows, { transaction: t });
    const suppliers = await Supplier.findAll({ transaction: t });
    console.log('Suppliers seeded');

    const products = await Product.findAll({ transaction: t });
    const warehouses = await Warehouse.findAll({ transaction: t });

    /* =========================
       PURCHASES + FIFO IN
    ========================= */
    for (let i = 1; i <= 25; i++) {
      const supplier = sample(suppliers);
      const warehouse = sample(warehouses);

      const purchase = await Purchase.create({
        supplier_id: supplier.id,
        warehouse_id: warehouse.id,
        invoice_no: `PUR-2026-${String(i).padStart(4,'0')}`,
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        status: 'UNPAID',
        lifecycle_status: 'CONFIRMED',
        created_at: new Date()
      }, { transaction: t });

      let subtotal = 0;

      for (let j = 0; j < rand(2,4); j++) {
        const p = sample(products);
        const qty = rand(10, 50);
        const cost = Number(p.cost_price || rand(200, 2000));
        const line = qty * cost;
        subtotal += line;

        await PurchaseItem.create({
          purchase_id: purchase.id,
          product_id: p.id,
          quantity: qty,
          unit_price: cost,
          total_price: line
        }, { transaction: t });

        await InventoryBatch.create({
          product_id: p.id,
          warehouse_id: warehouse.id,
          source_type: 'PURCHASE',
          source_id: purchase.id,
          quantity_remaining: qty,
          unit_cost: cost,
          created_at: new Date()
        }, { transaction: t });

        await StockMovement.create({
          product_id: p.id,
          warehouse_id: warehouse.id,
          change: qty,
          movement_type: 'IN',
          reference_type: 'PURCHASE',
          reference_id: purchase.id,
          reason: 'Seed purchase',
          user_id: 1,
          created_at: new Date()
        }, { transaction: t });
      }

      await purchase.update({ subtotal, total_amount: subtotal }, { transaction: t });
    }

    console.log('Purchases + inventory seeded');

    /* =========================
       SALES + FIFO OUT
    ========================= */
    for (let i = 1; i <= 40; i++) {
      const customer = sample(customers);
      const warehouse = sample(warehouses);

      const sale = await Sale.create({
        customer_id: customer.id,
        warehouse_id: warehouse.id,
        lifecycle_status: 'DRAFT',
        created_at: new Date()
      }, { transaction: t });

      let subtotal = 0;
      let tax = 0;

      for (let j = 0; j < rand(1,3); j++) {
        const p = sample(products);
        let need = rand(1,8);

        const batches = await InventoryBatch.findAll({
          where: { product_id: p.id, quantity_remaining: { [Op.gt]: 0 } },
          order: [['created_at','ASC']],
          transaction: t
        });

        let sold = 0;
        let costAmt = 0;

        for (const b of batches) {
          if (need <= 0) break;
          const take = Math.min(b.quantity_remaining, need);
          await b.update({ quantity_remaining: b.quantity_remaining - take }, { transaction: t });
          sold += take;
          costAmt += take * b.unit_cost;
          need -= take;

          await StockMovement.create({
            product_id: p.id,
            warehouse_id: b.warehouse_id,
            change: -take,
            movement_type: 'OUT',
            reference_type: 'SALE',
            reference_id: sale.id,
            reason: 'Seed sale',
            user_id: 1,
            created_at: new Date()
          }, { transaction: t });
        }

        if (sold > 0) {
          const price = Number(p.selling_price || p.cost_price * 1.5);
          const line = sold * price;
          subtotal += line;
          tax += line * (Number(p.gst_rate || 0) / 100);

          await SaleItem.create({
            sale_id: sale.id,
            product_id: p.id,
            quantity: sold,
            unit_price: price,
            total_price: line,
            cost_amount: costAmt
          }, { transaction: t });
        }
      }

      if (subtotal > 0) {
        const invoiceNo = await getNextInvoiceNo(t);

        await sale.update({
          invoice_no: invoiceNo,
          subtotal,
          taxable_value: subtotal,
          tax_amount: tax,
          total_amount: subtotal + tax,
          lifecycle_status: 'CONFIRMED',
          customer_gstin: customer.gstin,
          place_of_supply: customer.place_of_supply,
          sale_date: new Date()
        }, { transaction: t });
      } else {
        await sale.destroy({ transaction: t });
      }
    }

    console.log('Sales seeded');

    await t.commit();
    console.log('✅ SEED PHASE-1 COMPLETE — ALL TABLES WILL BE GOOD');
    process.exit(0);

  } catch (err) {
    await t.rollback();
    console.error('❌ SEED FAILED:', err);
    process.exit(1);
  }
}

run();
