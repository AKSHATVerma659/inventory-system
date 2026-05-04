const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('payments', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  reference_type: {
    type: DataTypes.STRING, // SALE | PURCHASE
    allowNull: false
  },

  reference_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false
  },

  payment_method: {
    type: DataTypes.STRING, // CARD | UPI | BANK | CASH
    allowNull: false
  },

  payment_details: {
    type: DataTypes.JSON,   // ✅ for UPI ID, bank, card last4, notes
    allowNull: true
  },

  paid_at: {
    type: DataTypes.DATE,
    allowNull: false
  },

  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  remarks: {
    type: DataTypes.STRING,
    allowNull: true
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'payments',
  timestamps: false,
  indexes: [
    {
      fields: ['reference_type', 'reference_id']
    }
  ]
});

module.exports = Payment;
