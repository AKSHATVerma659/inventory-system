const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('users', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
