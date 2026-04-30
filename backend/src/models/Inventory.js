const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('inventory', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(15,4), defaultValue: 0 },
  min_quantity: { type: DataTypes.DECIMAL(15,4), defaultValue: 0 }
}, {
  tableName: 'inventory',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { unique: true, fields: ['product_id', 'warehouse_id'] }
  ]
});


module.exports = Inventory;
