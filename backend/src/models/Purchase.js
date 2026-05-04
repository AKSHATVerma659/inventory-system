const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  supplier_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },

  warehouse_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  invoice_no: {
    type: DataTypes.STRING,
    allowNull: true
  },

  subtotal: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0
  },

  tax_amount: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0
  },

  total_amount: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0
  },

  // 🔒 PAYMENT LEDGER VALUE (NEVER NULL)
  paid_amount: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0
  },

  // 💰 PAYMENT STATUS (DERIVED)
  status: {
    type: DataTypes.STRING,
    defaultValue: 'UNPAID'
  },

  // 📦 BUSINESS / STOCK LIFECYCLE
  lifecycle_status: {
    type: DataTypes.STRING,
    defaultValue: 'DRAFT'
  }

}, {
  tableName: 'purchases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

Purchase.associate = (models) => {
  Purchase.belongsTo(models.Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
  });

  // ✅ FIXED ALIAS — MUST MATCH SERVICES
  Purchase.hasMany(models.PurchaseItem, {
    foreignKey: 'purchase_id',
    as: 'purchase_items'
  });
};

module.exports = Purchase;
