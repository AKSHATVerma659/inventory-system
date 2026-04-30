const productService = require('../services/productService');
const XLSX = require('xlsx');
const QRCode = require('qrcode');

/* ======================
   CRUD (PROTECTED)
====================== */

exports.create = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products);
};

exports.getOne = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
};

exports.update = async (req, res) => {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body
    );
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ======================
   🔽 EXPORT PRODUCTS
====================== */

const normalizeRows = (rows) =>
  rows.map(r => (r.toJSON ? r.toJSON() : { ...r }));

const sendCSV = (res, filename, rows) => {
  if (!rows.length) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.type('text/csv');
    return res.send('');
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => `"${row[h] ?? ''}"`).join(',')
    )
  ].join('\n');

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.type('text/csv');
  res.send(csv);
};

const sendXLSX = (res, filename, rows) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

exports.exportProducts = async (req, res) => {
  try {
    const rawRows = await productService.getAllProducts();
    const rows = normalizeRows(rawRows);
    const format = req.query.format || 'csv';

    return format === 'xlsx'
      ? sendXLSX(res, 'products.xlsx', rows)
      : sendCSV(res, 'products.csv', rows);
  } catch (err) {
    console.error('Product export error:', err);
    res.status(500).json({ error: 'Failed to export products' });
  }
};

/* ======================
   🔳 QR CODE (C1)
====================== */

exports.getProductQRCode = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const baseUrl =
      process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

    // 🔴 IMPORTANT: QR should open PUBLIC page
    const productUrl = `${baseUrl}/p/${product.id}`;

    const qrBuffer = await QRCode.toBuffer(productUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="product-${product.id}-qr.png"`
    );

    res.send(qrBuffer);
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

/* ======================
   🌍 PUBLIC PRODUCT (C2.2)
====================== */

/**
 * GET /api/products/public/:id
 * Public, read-only product view
 */
exports.getPublicProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Return ONLY safe fields
    res.json({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      selling_price: product.selling_price,
      is_active: product.is_active,
    });
  } catch (err) {
    console.error('Public product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};
