const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('sales', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  customer_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },

  warehouse_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  /**
   * 🔐 SINGLE SOURCE OF TRUTH FOR INVOICE NUMBER
   * - NULL for DRAFT
   * - Set exactly once on CONFIRM
   * - MUST be unique for GST
   */
  invoice_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },

  /* =========================
     FINANCIALS
  ========================= */
  subtotal: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  taxable_value: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  tax_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  cgst_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  sgst_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  igst_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  total_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  paid_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0
  },

  /* =========================
     GST META
  ========================= */
  customer_gstin: {
    type: DataTypes.STRING(20),
    allowNull: true
  },

  place_of_supply: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  /**
   * 🔥 GST SUPPLY TYPE (LOCKED AT CONFIRM TIME)
   * INTRA → CGST + SGST
   * INTER → IGST
   */
  supply_type: {
    type: DataTypes.ENUM('INTRA', 'INTER'),
    allowNull: false,
    defaultValue: 'INTRA'
  },

  is_interstate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  /* =========================
     STATUS
  ========================= */
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'UNPAID'
  },

  lifecycle_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'DRAFT'
  }

}, {
  tableName: 'sales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,

  indexes: [
    { fields: ['invoice_no'], unique: true },
    { fields: ['warehouse_id'] },
    { fields: ['lifecycle_status'] },
    { fields: ['created_at'] },
    { fields: ['supply_type'] }
  ]
});

/* =========================
   ASSOCIATIONS
========================= */
Sale.associate = (models) => {
  Sale.hasMany(models.SaleItem, {
    foreignKey: 'sale_id',
    as: 'sale_items'
  });

  Sale.belongsTo(models.Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
  });
};

module.exports = Sale;
