const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const exportController = require('../controllers/exportController');

router.get(
  '/inventory/excel',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  exportController.inventoryExcel
);

module.exports = router;
