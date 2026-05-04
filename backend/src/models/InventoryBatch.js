const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryBatch = sequelize.define(
  'InventoryBatch',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },

    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    warehouse_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    source_type: {
      type: DataTypes.ENUM('OPENING', 'PURCHASE', 'RETURN'),
      allowNull: false
    },

    source_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    quantity_remaining: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },

    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'inventory_batches',
    timestamps: false
  }
);

module.exports = InventoryBatch;
