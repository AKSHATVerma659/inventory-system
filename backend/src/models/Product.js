const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('products', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  sku: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: DataTypes.TEXT,

  category_id: DataTypes.BIGINT,
  brand_id: DataTypes.BIGINT,
  unit_id: DataTypes.BIGINT,

  cost_price: {
    type: DataTypes.DECIMAL(15,4),
    defaultValue: 0
  },

  selling_price: {
    type: DataTypes.DECIMAL(15,4),
    defaultValue: 0
  },

  /* ===============================
     🔥 GST FIELDS (CRITICAL)
  =============================== */
  hsn_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },

  gst_rate: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 0
  },

  barcode: DataTypes.STRING,

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'products',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;
