const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const purchaseController = require('../controllers/purchaseController');

router.get(
  '/',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  purchaseController.list
);

router.post(
  '/:id/confirm',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  purchaseController.confirm
);

router.get(
  '/summary',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  purchaseController.getPurchaseSummary
);

module.exports = router;
