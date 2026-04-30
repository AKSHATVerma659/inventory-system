const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
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

  change: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false
  },

  // 🔥 ENTERPRISE FIELD (THIS FIXES YOUR ERROR)
  movement_type: {
    type: DataTypes.STRING(20), // IN | OUT | ADJUST | TRANSFER
    allowNull: false
  },

  reference_type: {
    type: DataTypes.STRING(50) // PURCHASE | SALE | ADJUSTMENT | TRANSFER
  },

  reference_id: {
    type: DataTypes.BIGINT
  },

  reason: {
    type: DataTypes.STRING(255)
  },

  user_id: {
    type: DataTypes.BIGINT
  }
}, {
  tableName: 'stock_movements',   // ✅ EXPLICIT TABLE NAME
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = StockMovement;
