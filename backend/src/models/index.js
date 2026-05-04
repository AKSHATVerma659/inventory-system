const sequelize = require('../config/database');

const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');

const Product = require('./Product');
const Warehouse = require('./Warehouse');

const Inventory = require('./Inventory');
const InventoryBatch = require('./InventoryBatch');
const StockMovement = require('./StockMovement');

const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');

const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const SaleReturn = require('./SaleReturn');

const Payment = require('./Payment');
const ImportJob = require('./ImportJob');
const WarehouseTransfer = require('./WarehouseTransfer');

/* =========================
   NEW: Customers & Suppliers
========================= */
const Customer = require('./Customer');
const Supplier = require('./Supplier');

/* =========================
   USER & ROLE
========================= */
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });

/* =========================
   PURCHASE
========================= */
Purchase.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Warehouse.hasMany(Purchase, { foreignKey: 'warehouse_id', as: 'purchases' });

Purchase.hasMany(PurchaseItem, {
  foreignKey: 'purchase_id',
  as: 'purchase_items'
});
PurchaseItem.belongsTo(Purchase, {
  foreignKey: 'purchase_id',
  as: 'purchase'
});

/* Supplier ↔ Purchase (NEW) */
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Purchase, { foreignKey: 'supplier_id', as: 'purchases' });

/* =========================
   SALE
========================= */
Sale.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Warehouse.hasMany(Sale, { foreignKey: 'warehouse_id', as: 'sales' });

Sale.hasMany(SaleItem, {
  foreignKey: 'sale_id',
  as: 'sale_items'
});
SaleItem.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale'
});

/* Sale ↔ Customer (NEW) */
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });

/* =========================
   🔥 SALE ITEM ↔ PRODUCT (FIX)
========================= */
SaleItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(SaleItem, {
  foreignKey: 'product_id',
  as: 'sale_items'
});

/* =========================
   SALE RETURNS
========================= */
SaleReturn.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale'
});
Sale.hasMany(SaleReturn, {
  foreignKey: 'sale_id',
  as: 'returns'
});

/* =========================
   INVENTORY (SNAPSHOT)
========================= */
Inventory.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});
Inventory.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

Product.hasMany(Inventory, { foreignKey: 'product_id' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });

/* =========================
   INVENTORY BATCHES (FIFO)
========================= */
InventoryBatch.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});
InventoryBatch.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

Product.hasMany(InventoryBatch, {
  foreignKey: 'product_id',
  as: 'inventory_batches'
});
Warehouse.hasMany(InventoryBatch, {
  foreignKey: 'warehouse_id',
  as: 'inventory_batches'
});

/* =========================
   EXPORTS
========================= */
module.exports = {
  sequelize,

  User,
  Role,
  UserRole,

  Product,
  Warehouse,

  Inventory,
  InventoryBatch,
  StockMovement,

  Purchase,
  PurchaseItem,

  Sale,
  SaleItem,
  SaleReturn,

  Payment,
  ImportJob,
  WarehouseTransfer,

  /* newly exported models */
  Customer,
  Supplier
};
