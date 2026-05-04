const {
  Purchase,
  PurchaseItem,
  Inventory,
  StockMovement,
  InventoryBatch
} = require('../models');

const sequelize = require('../config/database');

exports.confirmPurchase = async (purchaseId, userId) => {
  return sequelize.transaction(async (t) => {

    // 1️⃣ Lock purchase row + correct alias
    const purchase = await Purchase.findByPk(purchaseId, {
      include: [{ model: PurchaseItem, as: 'purchase_items' }], // ✅ FIX
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    // 2️⃣ Idempotency
    if (purchase.status === 'CONFIRMED') {
      return purchase;
    }

    if (!['DRAFT', 'UNPAID', 'PARTIAL'].includes(purchase.status)) {
      throw new Error('Purchase cannot be confirmed');
    }

    if (!purchase.purchase_items || purchase.purchase_items.length === 0) {
      throw new Error('Cannot confirm purchase with no items');
    }

    // 3️⃣ Process each item
    for (const item of purchase.purchase_items) {

      // Ensure inventory row exists
      await Inventory.findOrCreate({
        where: {
          product_id: item.product_id,
          warehouse_id: purchase.warehouse_id
        },
        defaults: {
          quantity: 0,
          min_quantity: 0
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      // 4️⃣ Inventory quantity update
      await Inventory.update(
        {
          quantity: sequelize.literal(`quantity + ${item.quantity}`)
        },
        {
          where: {
            product_id: item.product_id,
            warehouse_id: purchase.warehouse_id
          },
          transaction: t
        }
      );

      // 5️⃣ Stock movement (ledger)
      await StockMovement.create({
        product_id: item.product_id,
        warehouse_id: purchase.warehouse_id,
        change: item.quantity,
        movement_type: 'IN',
        reference_type: 'PURCHASE',
        reference_id: purchase.id,
        reason: 'PURCHASE_CONFIRMED',
        user_id: userId
      }, { transaction: t });

      // 6️⃣ FIFO batch creation
      await InventoryBatch.create({
        product_id: item.product_id,
        warehouse_id: purchase.warehouse_id,
        source_type: 'PURCHASE',
        source_id: purchase.id,
        quantity_remaining: item.quantity,
        unit_cost: item.unit_price
      }, { transaction: t });
    }

    // 7️⃣ Mark purchase confirmed
    purchase.status = 'CONFIRMED';
    await purchase.save({ transaction: t });

    return purchase;
  });
};
