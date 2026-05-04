const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('user_roles', {
  user_id: DataTypes.BIGINT,
  role_id: DataTypes.BIGINT
}, {
  timestamps: false
});

module.exports = UserRole;
