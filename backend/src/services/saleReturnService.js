const sequelize = require('../config/database'); // ✅ THIS WAS MISSING

const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const SaleReturn = require('../models/SaleReturn');
const Inventory = require('../models/Inventory');
const InventoryBatch = require('../models/InventoryBatch');
const StockMovement = require('../models/StockMovement');
const { Op } = require('sequelize');

exports.processSaleReturn = async ({ saleId, items, userId }) => {
  return sequelize.transaction(async (t) => {
    const sale = await Sale.findByPk(saleId, {
      include: [{ model: SaleItem, as: 'sale_items' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!sale) throw new Error('Sale not found');
    if (sale.lifecycle_status !== 'CONFIRMED') {
      throw new Error('Only CONFIRMED sales can be returned');
    }

    const createdReturns = [];

    for (const returnItem of items) {
      const saleItem = sale.sale_items.find(
        si => si.id === returnItem.sale_item_id
      );

      if (!saleItem) {
        throw new Error(`Invalid sale_item_id ${returnItem.sale_item_id}`);
      }

      const returnQty = Number(returnItem.quantity);
      if (returnQty <= 0) {
        throw new Error('Return quantity must be > 0');
      }

      const prevReturned =
        (await SaleReturn.sum('quantity', {
          where: { sale_item_id: saleItem.id },
          transaction: t
        })) || 0;

      if (prevReturned + returnQty > Number(saleItem.quantity)) {
        throw new Error('Return exceeds sold quantity');
      }

      const costPerUnit =
        saleItem.quantity > 0
          ? Number(saleItem.cost_amount) / Number(saleItem.quantity)
          : 0;

      const unitRevenue = Number(saleItem.unit_price);

      const saleReturn = await SaleReturn.create(
        {
          sale_id: sale.id,
          sale_item_id: saleItem.id,
          product_id: saleItem.product_id,
          warehouse_id: sale.warehouse_id,
          quantity: returnQty,
          unit_price: unitRevenue,
          total_price: unitRevenue * returnQty,
          cost_amount: costPerUnit * returnQty,
          reason: returnItem.reason || 'Customer return',
          created_by: userId
        },
        { transaction: t }
      );

      const inventory = await Inventory.findOne({
        where: {
          product_id: saleItem.product_id,
          warehouse_id: sale.warehouse_id
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!inventory) {
        await Inventory.create(
          {
            product_id: saleItem.product_id,
            warehouse_id: sale.warehouse_id,
            quantity: returnQty,
            min_quantity: 0
          },
          { transaction: t }
        );
      } else {
        inventory.quantity += returnQty;
        await inventory.save({ transaction: t });
      }

      await StockMovement.create(
        {
          product_id: saleItem.product_id,
          warehouse_id: sale.warehouse_id,
          change: returnQty,
          movement_type: 'IN',
          reference_type: 'SALE_RETURN',
          reference_id: saleReturn.id,
          reason: saleReturn.reason,
          user_id: userId
        },
        { transaction: t }
      );

      await InventoryBatch.create(
        {
          product_id: saleItem.product_id,
          warehouse_id: sale.warehouse_id,
          source_type: 'RETURN',
          source_id: saleReturn.id,
          quantity_remaining: returnQty,
          unit_cost: costPerUnit
        },
        { transaction: t }
      );

      createdReturns.push(saleReturn);
    }

    return { success: true, createdReturns };
  });
};
