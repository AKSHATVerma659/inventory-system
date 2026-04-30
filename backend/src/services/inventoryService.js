const sequelize = require('../config/database');
const {
  Inventory,
  Product,
  Warehouse,
  StockMovement,
  WarehouseTransfer
} = require('../models');

const twilio = require('twilio');

/* ===============================
   WHATSAPP CLIENT (REUSE CONFIG)
================================ */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔒 in-memory low stock alert guard (one alert / product / day)
const LOW_STOCK_ALERTS = {};

/* ===============================
   HELPERS
================================ */
const todayKey = () => new Date().toISOString().slice(0, 10);

async function sendLowStockAlert({ product, warehouse, quantity, min_quantity }) {
  const key = `${product.id}_${todayKey()}`;
  if (LOW_STOCK_ALERTS[key]) return; // prevent spam

  LOW_STOCK_ALERTS[key] = true;

  await twilioClient.messages.create({
    from: 'whatsapp:+14155238886', // sandbox
    to: process.env.ADMIN_WHATSAPP_NUMBER,
    body: `⚠️ LOW STOCK ALERT

Product: ${product.name}
SKU: ${product.sku}
Warehouse: ${warehouse.name}

Current Qty: ${quantity}
Minimum Qty: ${min_quantity}

Immediate action recommended.`
  });
}

/* ===============================
   INVENTORY LIST
================================ */
exports.getInventoryWithLastMovement = async () => {
  const inventory = await Inventory.findAll({
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
    ],
    order: [['id', 'ASC']]
  });

  const result = [];

  for (const row of inventory) {
    const lastMovement = await StockMovement.findOne({
      where: {
        product_id: row.product_id,
        warehouse_id: row.warehouse_id
      },
      order: [['created_at', 'DESC']]
    });

    result.push({
      id: row.id,
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      product: row.product?.name,
      warehouse: row.warehouse?.name,
      quantity: Number(row.quantity),
      min_quantity: Number(row.min_quantity || 0),
      lastMovement
    });
  }

  return result;
};

exports.getMovementTimeline = async (productId, warehouseId) => {
  return StockMovement.findAll({
    where: { product_id: productId, warehouse_id: warehouseId },
    order: [['created_at', 'DESC']]
  });
};

/* ===============================
   WAREHOUSE TRANSFER (WITH ALERT)
================================ */
exports.transferStock = async ({
  product_id,
  from_warehouse_id,
  to_warehouse_id,
  quantity,
  reason,
  user_id
}) => {
  if (from_warehouse_id === to_warehouse_id) {
    throw new Error('Source and destination warehouses must be different');
  }

  await sequelize.transaction(async (t) => {
    // 🔒 Lock source inventory
    const sourceInventory = await Inventory.findOne({
      where: {
        product_id,
        warehouse_id: from_warehouse_id
      },
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    // 🔒 Lock / create destination inventory
    const [destInventory] = await Inventory.findOrCreate({
      where: {
        product_id,
        warehouse_id: to_warehouse_id
      },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    // 1️⃣ OUT
    await sourceInventory.decrement({ quantity }, { transaction: t });

    // 2️⃣ IN
    await destInventory.increment({ quantity }, { transaction: t });

    // 3️⃣ Ledger OUT
    await StockMovement.create({
      product_id,
      warehouse_id: from_warehouse_id,
      change: -quantity,
      movement_type: 'TRANSFER_OUT',
      reference_type: 'TRANSFER',
      reference_id: null,
      reason: reason || 'Warehouse transfer',
      user_id
    }, { transaction: t });

    // 4️⃣ Ledger IN
    await StockMovement.create({
      product_id,
      warehouse_id: to_warehouse_id,
      change: quantity,
      movement_type: 'TRANSFER_IN',
      reference_type: 'TRANSFER',
      reference_id: null,
      reason: reason || 'Warehouse transfer',
      user_id
    }, { transaction: t });

    // 5️⃣ Business record
    await WarehouseTransfer.create({
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reason,
      created_by: user_id
    }, { transaction: t });

    // 🚨 LOW STOCK CHECK (AFTER DECREMENT)
    const remainingQty = Number(sourceInventory.quantity) - quantity;
    const minQty = Number(sourceInventory.min_quantity || 0);

    if (remainingQty <= minQty) {
      await sendLowStockAlert({
        product: sourceInventory.product,
        warehouse: sourceInventory.warehouse,
        quantity: remainingQty,
        min_quantity: minQty
      });
    }
  });
};
