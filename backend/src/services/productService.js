const { Product, StockMovement, Inventory } = require('../models');

exports.createProduct = async (data) => {
  data.is_active = true;
  return Product.create(data);
};

exports.getAllProducts = async () => {
  return Product.findAll({ order: [['created_at', 'DESC']] });
};

exports.getProductById = async (id) => {
  return Product.findByPk(id);
};

exports.updateProduct = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  return product.update(data);
};

exports.deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  // 🔒 ERP SAFETY: block delete if stock exists
  const stock = await Inventory.findOne({ where: { product_id: id } });
  if (stock && Number(stock.quantity) > 0) {
    throw new Error('Cannot delete product with existing stock');
  }

  const movements = await StockMovement.count({
    where: { product_id: id }
  });

  if (movements > 0) {
    throw new Error('Cannot delete product with stock history');
  }

  // ✅ SOFT DELETE
  return product.update({ is_active: false });
};
