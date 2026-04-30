const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleReturn = sequelize.define('sale_returns', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  sale_item_id: {                 // NEW: reference to sale_items row
    type: DataTypes.INTEGER,
    allowNull: false
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  quantity: {
    type: DataTypes.DECIMAL(15,4),
    allowNull: false
  },

  unit_price: {                   // NEW: revenue per unit refunded
    type: DataTypes.DECIMAL(15,4),
    allowNull: false,
    defaultValue: 0
  },

  total_price: {                  // NEW: unit_price * quantity
    type: DataTypes.DECIMAL(15,4),
    allowNull: false,
    defaultValue: 0
  },

  cost_amount: {                  // NEW: total COGS returned (quantity * cost_per_unit)
    type: DataTypes.DECIMAL(15,4),
    allowNull: false,
    defaultValue: 0
  },

  reason: {
    type: DataTypes.STRING
  },

  created_by: {
    type: DataTypes.INTEGER
  }

}, {
  tableName: 'sale_returns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SaleReturn;
