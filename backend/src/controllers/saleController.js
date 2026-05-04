const saleService = require('../services/saleService');
const sequelize = require('../config/database');
const twilio = require('twilio');
const { Op } = require('sequelize');

const {
  Sale,
  SaleItem,
  Inventory,
  StockMovement,
  SaleReturn,
  Warehouse,
  Product
} = require('../models');

/* ===============================
   TWILIO CLIENT
================================ */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ===============================
   HELPER: FINANCIAL YEAR
================================ */
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month < 4
    ? `${year - 1}-${String(year).slice(-2)}`
    : `${year}-${String(year + 1).slice(-2)}`;
}

/* ===============================
   LIST SALES
================================ */
exports.listSales = async (req, res) => {
  try {
    const sales = await Sale.findAll({
      attributes: [
        'id',
        'invoice_no',
        'subtotal',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'status',
        'lifecycle_status',
        'created_at'
      ],
      include: [{ model: Warehouse, as: 'warehouse', attributes: ['name'] }],
      order: [['id', 'DESC']]
    });

    res.json(
      sales.map(s => ({
        id: s.id,
        invoice_no: s.invoice_no,
        warehouse: s.warehouse?.name || null,
        subtotal: Number(s.subtotal),
        tax_amount: Number(s.tax_amount || 0),
        total_amount: Number(s.total_amount),
        paid_amount: Number(s.paid_amount),
        status: s.status,
        lifecycle_status: s.lifecycle_status,
        created_at: s.created_at
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

/* ===============================
   CREATE SALE (DRAFT)
================================ */
exports.createSale = async (req, res) => {
  const { warehouse_id, customer_id, items } = req.body;

  if (!warehouse_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'warehouse_id and items are required' });
  }

  try {
    const sale = await sequelize.transaction(async (t) => {
      const newSale = await Sale.create({
        warehouse_id,
        customer_id,
        status: 'UNPAID',
        lifecycle_status: 'DRAFT'
      }, { transaction: t });

      let subtotal = 0;

      for (const item of items) {
        const qty = Number(item.quantity);
        const price = Number(item.unit_price);

        if (!item.product_id || qty <= 0 || price < 0) {
          throw new Error('Invalid sale item data');
        }

        const lineTotal = qty * price;
        subtotal += lineTotal;

        await SaleItem.create({
          sale_id: newSale.id,
          product_id: item.product_id,
          quantity: qty,
          unit_price: price,
          total_price: lineTotal,
          cost_amount: 0
        }, { transaction: t });
      }

      newSale.subtotal = subtotal;
      newSale.total_amount = subtotal;
      await newSale.save({ transaction: t });

      return newSale;
    });

    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===============================
   CONFIRM SALE (STOCK + GST)
================================ */
exports.confirm = async (req, res) => {
  try {
    const sale = await sequelize.transaction(async (t) => {
      const sale = await Sale.findByPk(req.params.id, {
        include: [{
          model: SaleItem,
          as: 'sale_items',
          include: [{ model: Product, as: 'product' }]
        }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!sale) throw new Error('Sale not found');
      if (sale.lifecycle_status !== 'DRAFT')
        throw new Error('Sale already confirmed');

      await saleService.confirmSale(sale.id, req.user.id, t);

      let taxable = 0, cgst = 0, sgst = 0, igst = 0;

      for (const item of sale.sale_items) {
        const line = Number(item.total_price);
        taxable += line;
        const rate = Number(item.product?.gst_rate || 0);
        const tax = (line * rate) / 100;
        sale.is_interstate ? igst += tax : (cgst += tax / 2, sgst += tax / 2);
      }

      if (!sale.invoice_no) {
        const fy = getFinancialYear();
        const last = await Sale.findOne({
          where: { invoice_no: { [Op.like]: `INV/${fy}/%` } },
          order: [['created_at', 'DESC']],
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        const next = last ? Number(last.invoice_no.split('/').pop()) + 1 : 1;
        sale.invoice_no = `INV/${fy}/${String(next).padStart(6, '0')}`;
      }

      sale.taxable_value = taxable;
      sale.cgst_amount = cgst;
      sale.sgst_amount = sgst;
      sale.igst_amount = igst;
      sale.tax_amount = cgst + sgst + igst;
      sale.total_amount = taxable + sale.tax_amount;
      sale.lifecycle_status = 'CONFIRMED';

      await sale.save({ transaction: t });
      return sale;
    });

    res.json({ success: true, sale });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===============================
   SETTLE SALE (PAYMENT + WHATSAPP)
================================ */
exports.settle = async (req, res) => {
  try {
    const sale = await sequelize.transaction(async (t) => {
      const sale = await Sale.findByPk(req.params.id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!sale) throw new Error('Sale not found');
      if (sale.status === 'PAID') throw new Error('Already settled');

      sale.paid_amount = sale.total_amount;
      sale.status = 'PAID';

      await sale.save({ transaction: t });
      return sale;
    });

    try {
      await twilioClient.messages.create({
        from: 'whatsapp:+14155238886',
        to: process.env.ADMIN_WHATSAPP_NUMBER,
        body: `💰 SALE SETTLED

Invoice: ${sale.invoice_no}
Amount: ₹ ${Number(sale.total_amount).toLocaleString('en-IN')}`
      });
    } catch (e) {
      console.error('WhatsApp failed:', e.message);
    }

    res.json({ success: true, sale });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===============================
   SALE RETURN
================================ */
exports.processSaleReturn = async (req, res) => {
  const { product_id, quantity, reason } = req.body;

  if (!product_id || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Invalid return data' });
  }

  try {
    await sequelize.transaction(async (t) => {
      const sale = await Sale.findByPk(req.params.id, { transaction: t });
      if (!sale) throw new Error('Sale not found');

      const saleItem = await SaleItem.findOne({
        where: { sale_id: sale.id, product_id },
        transaction: t
      });
      if (!saleItem) throw new Error('Product not in sale');

      const inventory = await Inventory.findOne({
        where: {
          product_id,
          warehouse_id: sale.warehouse_id
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      inventory.quantity += Number(quantity);
      await inventory.save({ transaction: t });

      await StockMovement.create({
        product_id,
        warehouse_id: sale.warehouse_id,
        change: quantity,
        movement_type: 'IN',
        reference_type: 'SALE_RETURN',
        reference_id: sale.id,
        reason: reason || 'SALE RETURN',
        user_id: req.user.id
      }, { transaction: t });

      await SaleReturn.create({
        sale_id: sale.id,
        product_id,
        warehouse_id: sale.warehouse_id,
        quantity,
        reason,
        created_by: req.user.id
      }, { transaction: t });
    });

    res.json({ message: 'Sale return processed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
