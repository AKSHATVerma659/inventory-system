const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

router.get('/', auth, inventoryController.listInventory);

router.get(
  '/:productId/:warehouseId/movements',
  auth,
  inventoryController.inventoryTimeline
);

// 🔥 STEP 16 — WAREHOUSE TRANSFER
router.post(
  '/transfer',
  auth,
  inventoryController.transferStock
);

module.exports = router;
