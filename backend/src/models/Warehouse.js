const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'warehouses',
  timestamps: false
});

Warehouse.associate = (models) => {
  Warehouse.hasMany(models.Purchase, {
    foreignKey: 'warehouse_id',
    as: 'purchases'
  });

  Warehouse.hasMany(models.Inventory, {
    foreignKey: 'warehouse_id',
    as: 'inventories'
  });
};

module.exports = Warehouse;
