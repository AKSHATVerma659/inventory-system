const paymentService = require('../services/paymentService');

exports.create = async (req, res) => {
  try {
    const payment = await paymentService.addPayment({
      ...req.body,
      user_id: req.user.id
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const { Payment } = require('../models');

/**
 * GET payment history for a reference (Purchase or Sale)
 * /payments/history?type=PURCHASE&id=123
 */
exports.history = async (req, res) => {
  try {
    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ error: 'type and id are required' });
    }

    const payments = await Payment.findAll({
      where: {
        reference_type: type,
        reference_id: id
      },
      order: [['paid_at', 'DESC']]
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
