const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const notificationController = require('../controllers/notificationController');

/* ===============================
   MANUAL STOCK SUMMARY (D2-B)
   POST /api/notifications/stock-summary
================================ */
router.post(
  '/stock-summary',
  auth,
  authorize(['ADMIN']),
  notificationController.sendStockSummary
);

module.exports = router;
