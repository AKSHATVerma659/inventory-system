const {
  Sale,
  SaleItem,
  Inventory,
  StockMovement,
  InventoryBatch
} = require('../models');

const { Op } = require('sequelize');

/**
 * CONFIRM SALE
 * - FIFO OUT
 * - COGS calculation
 * - GST FINALIZATION (LOCKED)
 * - Invoice number generated ONCE
 * - Transaction is passed from controller
 */
exports.confirmSale = async (saleId, userId, transaction) => {

  /* ===============================
     1️⃣ Load & lock sale
  =============================== */
  const sale = await Sale.findByPk(saleId, {
    include: [
      {
        model: SaleItem,
        as: 'sale_items'
      }
    ],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (!sale) throw new Error('Sale not found');

  if (sale.lifecycle_status === 'CONFIRMED') {
    return { alreadyConfirmed: true };
  }

  if (sale.lifecycle_status !== 'DRAFT') {
    throw new Error('Only DRAFT sales can be confirmed');
  }

  /* ===============================
     2️⃣ FIFO OUT + COGS (UNCHANGED)
  =============================== */
  let subtotal = 0;

  for (const item of sale.sale_items) {
    const requiredQty = Number(item.quantity);
    let remainingQty = requiredQty;

    subtotal += Number(item.total_price);

    const inventory = await Inventory.findOne({
      where: {
        product_id: item.product_id,
        warehouse_id: sale.warehouse_id
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!inventory) {
      throw new Error(`No inventory for product ${item.product_id}`);
    }

    if (Number(inventory.quantity) < requiredQty) {
      throw new Error(`Insufficient stock for product ${item.product_id}`);
    }

    const batches = await InventoryBatch.findAll({
      where: {
        product_id: item.product_id,
        warehouse_id: sale.warehouse_id,
        quantity_remaining: { [Op.gt]: 0 }
      },
      order: [['created_at', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    let totalCost = 0;

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const available = Number(batch.quantity_remaining);
      if (available <= 0) continue;

      const consumeQty = Math.min(available, remainingQty);
      totalCost += consumeQty * Number(batch.unit_cost);

      batch.quantity_remaining = available - consumeQty;
      await batch.save({ transaction });

      remainingQty -= consumeQty;
    }

    if (remainingQty > 0) {
      throw new Error(`FIFO batches insufficient for product ${item.product_id}`);
    }

    /* Persist FIFO COGS */
    item.cost_amount = totalCost;
    await item.save({ transaction });

    /* Update inventory snapshot */
    inventory.quantity = Number(inventory.quantity) - requiredQty;
    await inventory.save({ transaction });

    /* Stock ledger */
    await StockMovement.create({
      product_id: item.product_id,
      warehouse_id: sale.warehouse_id,
      change: -requiredQty,
      movement_type: 'OUT',
      reference_type: 'SALE',
      reference_id: sale.id,
      reason: 'SALE_CONFIRMED',
      user_id: userId
    }, { transaction });
  }

  /* ===============================
     3️⃣ GST FINALIZATION (LOCKED)
  =============================== */
  const taxableValue = subtotal;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (sale.is_interstate) {
    igst = taxableValue * 0.18; // 18% IGST
    sale.supply_type = 'INTER';
  } else {
    cgst = taxableValue * 0.09; // 9% CGST
    sgst = taxableValue * 0.09; // 9% SGST
    sale.supply_type = 'INTRA';
  }

  const taxAmount = cgst + sgst + igst;
  const totalAmount = taxableValue + taxAmount;

  /* ===============================
     4️⃣ Invoice number (ONCE)
  =============================== */
  if (!sale.invoice_no) {
    const year = new Date().getFullYear();
    sale.invoice_no = `INV-${year}-${sale.id}`;
  }

  /* ===============================
     5️⃣ Persist financials
  =============================== */
  sale.subtotal = subtotal;
  sale.taxable_value = taxableValue;
  sale.cgst_amount = cgst;
  sale.sgst_amount = sgst;
  sale.igst_amount = igst;
  sale.tax_amount = taxAmount;
  sale.total_amount = totalAmount;

  await sale.save({ transaction });

  return {
    success: true,
    sale_id: sale.id,
    invoice_no: sale.invoice_no,
    taxable_value: taxableValue,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    is_interstate: sale.is_interstate
  };
};
