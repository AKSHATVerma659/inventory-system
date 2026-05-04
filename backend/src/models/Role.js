const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('roles', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true }
}, {
  timestamps: false
});

module.exports = Role;
