const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const paymentController = require('../controllers/paymentController');

// Create payment (manual / auto)
router.post(
  '/',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  paymentController.create
);

// 🔍 Payment history (read-only, ERP ledger)
router.get(
  '/history',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  paymentController.history
);

module.exports = router;
