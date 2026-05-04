const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportJob = sequelize.define('import_jobs', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  type: {
    type: DataTypes.STRING,
    allowNull: false
  },

  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'),
    defaultValue: 'UPLOADED'
  },

  total_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  success_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  failed_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  error_file_path: {
    type: DataTypes.STRING
  },

  created_by: {
    type: DataTypes.BIGINT
  }

}, {
  tableName: 'import_jobs',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ImportJob;
