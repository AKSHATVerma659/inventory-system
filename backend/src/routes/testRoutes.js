const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const testController = require('../controllers/testController');
const { sendWhatsAppAlert } = require('../services/whatsappService');

/* =========================
   ADMIN TEST ROUTE
========================= */
router.get(
  '/admin',
  auth,
  authorize(['ADMIN']),
  testController.adminOnly
);

/* =========================
   WHATSAPP TEST (D1.3)
========================= */
router.post(
  '/whatsapp',
  auth,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const message =
        '📦 Inventory ERP Test Alert\n\nWhatsApp integration is working successfully.';

      await sendWhatsAppAlert(message);

      res.json({
        success: true,
        message: 'WhatsApp test message sent successfully',
      });
    } catch (err) {
      console.error('WhatsApp test failed:', err.message);

      res.status(500).json({
        success: false,
        error: err.message || 'Failed to send WhatsApp message',
      });
    }
  }
);

module.exports = router;
