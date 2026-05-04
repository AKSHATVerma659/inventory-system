const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  purchase_id: DataTypes.BIGINT,
  product_id: DataTypes.BIGINT,
  quantity: DataTypes.DECIMAL(15, 4),
  unit_price: DataTypes.DECIMAL(15, 4),
  total_price: DataTypes.DECIMAL(15, 4)
}, {
  tableName: 'purchase_items',
  timestamps: false
});

PurchaseItem.associate = (models) => {
  PurchaseItem.belongsTo(models.Purchase, {
    foreignKey: 'purchase_id',
    as: 'purchase'
  });

  PurchaseItem.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

module.exports = PurchaseItem;
