const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseTransfer = sequelize.define('warehouse_transfers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  from_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  to_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  reason: {
    type: DataTypes.STRING
  },

  created_by: {
    type: DataTypes.INTEGER
  }

}, {
  tableName: 'warehouse_transfers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = WarehouseTransfer;
