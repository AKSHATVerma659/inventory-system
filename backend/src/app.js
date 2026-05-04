const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = (process.env.FRONTEND_BASE_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());

const fs = require('fs');
const path = require('path');

function safeRequire(routePath) {
  const fullPath = path.join(__dirname, routePath) + '.js';
  if (fs.existsSync(fullPath)) {
    return require(routePath);
  }
  return null;
}

const authRoutes = safeRequire('./routes/authRoutes');
const testRoutes = safeRequire('./routes/testRoutes');
const productRoutes = safeRequire('./routes/productRoutes');
const inventoryRoutes = safeRequire('./routes/inventoryRoutes');
const purchaseRoutes = safeRequire('./routes/purchaseRoutes');
const saleRoutes = safeRequire('./routes/saleRoutes');
const paymentRoutes = safeRequire('./routes/paymentRoutes');
const reportRoutes = safeRequire('./routes/reportRoutes');
const importRoutes = safeRequire('./routes/importRoutes');
const exportRoutes = safeRequire('./routes/exportRoutes');
const pdfRoutes = safeRequire('./routes/pdfRoutes');
const saleReturnRoutes = safeRequire('./routes/saleReturnRoutes');

/* 🔔 NEW: notifications */
const notificationRoutes = safeRequire('./routes/notificationRoutes');

if (authRoutes) app.use('/api/auth', authRoutes);
if (testRoutes) app.use('/api/test', testRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (inventoryRoutes) app.use('/api/inventory', inventoryRoutes);
if (purchaseRoutes) app.use('/api/purchases', purchaseRoutes);
if (saleRoutes) app.use('/api/sales', saleRoutes);
if (saleReturnRoutes) app.use('/api/sales', saleReturnRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (reportRoutes) app.use('/api/reports', reportRoutes);
if (importRoutes) app.use('/api/imports', importRoutes);
if (exportRoutes) app.use('/api/export', exportRoutes);
if (pdfRoutes) app.use('/api/pdf', pdfRoutes);

/* 🔔 NEW */
if (notificationRoutes) app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Inventory Asset System API running');
});

module.exports = app;
