const twilio = require('twilio');

/* ==============================
   TWILIO CLIENT (SANDBOX SAFE)
================================ */

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ==============================
   ADMIN TEST ENDPOINT
   GET /api/test/admin
================================ */

exports.adminOnly = async (req, res) => {
  try {
    // 🔴 IMPORTANT:
    // In WhatsApp Sandbox, FROM must be hardcoded
    // This number does NOT belong to your account
    const fromWhatsApp = 'whatsapp:+14155238886';

    const toWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER;

    if (!toWhatsApp) {
      return res.status(400).json({
        success: false,
        error: 'ADMIN_WHATSAPP_NUMBER not configured'
      });
    }

    await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body: `✅ Inventory ERP – WhatsApp Test Successful

Hello Admin 👋

This confirms:
• Twilio Sandbox is connected
• WhatsApp messaging works
• Auth + Role middleware passed

User ID: ${req.user.id}
Role(s): ${req.user.roles.join(', ')}

System Status: ONLINE 🚀`
    });

    res.json({
      success: true,
      message: 'Welcome Admin',
      whatsapp: 'Test message sent successfully',
      user: req.user
    });
  } catch (err) {
    console.error('WhatsApp test error:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: err.message
    });
  }
};
