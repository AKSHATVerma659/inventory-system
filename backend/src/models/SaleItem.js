const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleItem = sequelize.define('sale_items', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  sale_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  product_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0.0001
    }
  },

  unit_price: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0
    }
  },

  total_price: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0
    }
  },

  /**
   * FIFO Cost Of Goods Sold
   * Persisted at SALE CONFIRM time
   */
  cost_amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }

}, {
  tableName: 'sale_items',
  freezeTableName: true,
  timestamps: false,

  indexes: [
    {
      fields: ['sale_id']
    },
    {
      fields: ['product_id']
    }
  ]
});

/* =========================
   ASSOCIATIONS
========================= */
SaleItem.associate = (models) => {
  SaleItem.belongsTo(models.Sale, {
    foreignKey: 'sale_id',
    as: 'sale'
  });

  SaleItem.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
};

module.exports = SaleItem;
