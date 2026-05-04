const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const saleController = require('../controllers/saleController');
const invoiceController = require('../controllers/invoiceController');

/* =========================
   SALES
========================= */

// LIST SALES
router.get(
  '/',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  saleController.listSales
);

// CREATE SALE (DRAFT)
router.post(
  '/',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  saleController.createSale
);

// CONFIRM SALE (FIFO OUT + GST)
router.post(
  '/:id/confirm',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  saleController.confirm
);

// 💰 SETTLE SALE (PAYMENT + WHATSAPP)
router.post(
  '/:id/settle',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  saleController.settle
);

// SALE RETURN
router.post(
  '/:id/return',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  saleController.processSaleReturn
);

// ================================
// INVOICE PDF
// ================================
router.get(
  '/:id/invoice/pdf',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  invoiceController.downloadInvoicePDF
);

module.exports = router;
