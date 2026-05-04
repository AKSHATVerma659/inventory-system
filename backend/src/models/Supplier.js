const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'suppliers',
    timestamps: false,          // ✅ important
    createdAt: 'created_at'
  }
);

module.exports = Supplier;
