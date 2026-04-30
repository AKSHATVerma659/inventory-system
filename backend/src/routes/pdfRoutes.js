const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const pdfController = require('../controllers/pdfController');

router.get(
  '/sales',
  auth,
  authorize(['ADMIN']),
  pdfController.salesPDF
);

module.exports = router;
