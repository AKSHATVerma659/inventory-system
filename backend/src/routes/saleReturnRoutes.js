const express = require('express');
const router = express.Router();

// <-- corrected middleware path to match your project structure
const auth = require('../middlewares/authMiddleware');

const saleReturnController = require('../controllers/saleReturnController');

// POST /api/sales/returns
router.post('/returns', auth, saleReturnController.createSaleReturn);

module.exports = router;
