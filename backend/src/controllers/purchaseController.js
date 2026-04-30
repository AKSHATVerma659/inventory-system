const purchaseService = require('../services/purchaseService');
const { Purchase, Warehouse } = require('../models');
const { Sequelize } = require('sequelize');
const twilio = require('twilio');

/* ===============================
   TWILIO CLIENT (SANDBOX)
================================ */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * GET /api/purchases
 */
exports.list = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['name']
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(
      purchases.map(p => ({
        id: p.id,
        invoice_no: p.invoice_no,
        warehouse: p.warehouse?.name || null,
        total_amount: Number(p.total_amount),
        paid_amount: Number(p.paid_amount),
        status: p.status,
        created_at: p.created_at
      }))
    );
  } catch (err) {
    console.error('Purchase list error:', err);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};

/**
 * POST /api/purchases/:id/confirm
 * Inventory IN + WhatsApp (non-blocking)
 */
exports.confirm = async (req, res) => {
  try {
    const purchase = await purchaseService.confirmPurchase(
      req.params.id,
      req.user.id
    );

    /* ===============================
       WHATSAPP ALERT (SAFE)
    =============================== */
    try {
      const fullPurchase = await Purchase.findByPk(purchase.id, {
        include: [
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['name']
          }
        ]
      });

      if (fullPurchase) {
        await twilioClient.messages.create({
          from: 'whatsapp:+14155238886',
          to: process.env.ADMIN_WHATSAPP_NUMBER,
          body: `📥 PURCHASE CONFIRMED

Invoice: ${fullPurchase.invoice_no || fullPurchase.id}
Warehouse: ${fullPurchase.warehouse?.name || 'N/A'}
Total Amount: ₹ ${Number(fullPurchase.total_amount).toLocaleString('en-IN')}

Confirmed by User ID: ${req.user.id}`
        });
      }
    } catch (twilioErr) {
      console.error(
        'Purchase WhatsApp failed:',
        twilioErr.message
      );
    }

    res.json({
      success: true,
      message: 'Purchase confirmed',
      purchase
    });
  } catch (err) {
    console.error('Purchase confirm error:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * GET /api/purchases/summary
 */
exports.getPurchaseSummary = async (req, res) => {
  try {
    const result = await Purchase.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    res.json({
      totalPurchases: Number(result.total || 0)
    });
  } catch (err) {
    console.error('Purchase summary error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase summary' });
  }
};
