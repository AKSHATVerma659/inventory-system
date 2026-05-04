const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const reportController = require('../controllers/reportController');

/* ======================
   EXISTING REPORT APIs
====================== */

// Sales
router.get(
  '/sales',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.sales
);

// Inventory
router.get(
  '/inventory',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.inventory
);

// Purchases
router.get(
  '/purchases',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.purchasesReport
);

// Purchase Quantity
router.get(
  '/purchases/quantity',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.purchaseQuantityReport
);

// Combined Sales vs Purchases
router.get(
  '/combined',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.combinedReport
);

// Revenue
router.get(
  '/revenue',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.revenue
);

// COGS
router.get(
  '/cogs',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.cogs
);

// Profit
router.get(
  '/profit',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.profit
);

// Inventory valuation (existing)
router.get(
  '/inventory-valuation',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.inventoryValuation
);

// Inventory value helpers
router.get(
  '/inventory/value',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.inventoryValue
);

router.get(
  '/inventory/value-by-product',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.inventoryValueByProduct
);

router.get(
  '/inventory/value-by-warehouse',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.inventoryValueByWarehouse
);

/* ======================
   🔥 GST REPORT ROUTES
====================== */

// GSTR-1 (Outward Supplies)
router.get(
  '/gstr1',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.gstr1
);

// HSN Summary
router.get(
  '/hsn',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.hsn
);

/* ======================
   🔽 FEATURE B — EXPORTS
====================== */

// Export Sales
router.get(
  '/sales/export',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.exportSales
);

// Export Inventory
router.get(
  '/inventory/export',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.exportInventory
);

// Export Purchases
router.get(
  '/purchases/export',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.exportPurchases
);

// Export Sales vs Purchases
router.get(
  '/combined/export',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  reportController.exportCombined
);

module.exports = router;
