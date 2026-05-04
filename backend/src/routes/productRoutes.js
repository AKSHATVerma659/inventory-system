const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const productController = require('../controllers/productController');

/* ======================
   🌍 PUBLIC ROUTE (C2.2)
   MUST COME FIRST
====================== */
router.get(
  '/public/:id',
  productController.getPublicProductById
);

/* 🔽 EXPORT MUST COME FIRST */
router.get(
  '/export',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  productController.exportProducts
);

/* CRUD (PROTECTED) */
router.post('/', auth, authorize(['ADMIN']), productController.create);
router.get('/', auth, productController.getAll);

/* 🔳 QR CODE (C1) */
router.get(
  '/:id/qrcode',
  auth,
  authorize(['ADMIN', 'MANAGER']),
  productController.getProductQRCode
);

/* single product */
router.get('/:id', auth, productController.getOne);
router.put('/:id', auth, authorize(['ADMIN']), productController.update);
router.delete('/:id', auth, authorize(['ADMIN']), productController.remove);

module.exports = router;
