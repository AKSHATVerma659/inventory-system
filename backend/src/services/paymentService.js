const { Payment, Purchase, Sale, sequelize } = require('../models');
const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.addPayment = async ({
  reference_type,
  reference_id,
  amount,
  payment_method,
  payment_details,
  remarks,
  user_id
}) => {
  return sequelize.transaction(async (t) => {

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // 1️⃣ Load reference with row lock
    const Model = reference_type === 'SALE' ? Sale : Purchase;
    const record = await Model.findByPk(reference_id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!record) {
      throw new Error(`${reference_type} not found`);
    }

    const total = Number(record.total_amount || 0);
    const alreadyPaid = Number(record.paid_amount || 0);

    if (total <= 0) {
      throw new Error('Cannot accept payment for zero-value record');
    }

    const remaining = total - alreadyPaid;
    if (remaining <= 0) {
      throw new Error('This record is already fully paid');
    }

    // 2️⃣ Cap payment
    const appliedAmount = Math.min(paymentAmount, remaining);

    // 3️⃣ Create payment ledger entry
    const payment = await Payment.create({
      reference_type,
      reference_id,
      amount: appliedAmount,
      payment_method,
      payment_details: payment_details || null,
      remarks: remarks || null,
      created_by: user_id,
      paid_at: new Date()
    }, { transaction: t });

    // 4️⃣ Update paid amount
    const newPaidAmount = alreadyPaid + appliedAmount;
    record.paid_amount = newPaidAmount;

    // 5️⃣ Derive status
    let becamePaidNow = false;

    if (newPaidAmount >= total) {
      record.status = 'PAID';
      becamePaidNow = alreadyPaid < total; // just transitioned
    } else if (newPaidAmount > 0) {
      record.status = 'PARTIAL';
    } else {
      record.status = 'UNPAID';
    }

    await record.save({ transaction: t });

    // 6️⃣ WHATSAPP — ONLY WHEN SALE IS FULLY PAID
    if (reference_type === 'SALE' && becamePaidNow) {
      try {
        await twilioClient.messages.create({
          from: 'whatsapp:+14155238886',
          to: process.env.ADMIN_WHATSAPP_NUMBER,
          body: `💰 SALE PAYMENT RECEIVED

Invoice: ${record.invoice_no}
Total Paid: ₹ ${Number(record.paid_amount).toLocaleString('en-IN')}
Status: PAID`
        });
      } catch (err) {
        console.error('WhatsApp payment alert failed:', err.message);
      }
    }

    return {
      payment,
      applied_amount: appliedAmount,
      remaining_balance: total - newPaidAmount
    };
  });
};
