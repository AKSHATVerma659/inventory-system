'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1️⃣ FK-safe reset (order matters)
      await queryInterface.bulkDelete('stock_movements', null, { transaction });
      await queryInterface.bulkDelete('inventory_batches', null, { transaction });
      await queryInterface.bulkDelete('inventory', null, { transaction });

      // 2️⃣ Fetch products & warehouse
      const products = await queryInterface.sequelize.query(
        `SELECT id, cost_price FROM products WHERE is_active = 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const warehouse = await queryInterface.sequelize.query(
        `SELECT id FROM warehouses ORDER BY id LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!warehouse.length) {
        throw new Error('No warehouse found for opening inventory');
      }

      const warehouseId = warehouse[0].id;
      const now = new Date();

      const inventoryRows = [];
      const batchRows = [];
      const movementRows = [];

      for (const product of products) {
        const openingQty = Math.floor(Math.random() * 200) + 50; // 50–250 units

        // Inventory snapshot (NO timestamps)
        inventoryRows.push({
          product_id: product.id,
          warehouse_id: warehouseId,
          quantity: openingQty,
          min_quantity: 10
        });

        // FIFO OPENING batch
        batchRows.push({
          product_id: product.id,
          warehouse_id: warehouseId,
          source_type: 'OPENING',
          source_id: null,
          quantity_remaining: openingQty,
          unit_cost: product.cost_price || 0,
          created_at: now
        });

        // Stock movement ledger
        movementRows.push({
          product_id: product.id,
          warehouse_id: warehouseId,
          change: openingQty,
          movement_type: 'IN',
          reference_type: 'OPENING',
          reference_id: null,
          reason: 'Opening stock seed',
          user_id: null,
          created_at: now
        });
      }

      // 3️⃣ Bulk inserts
      await queryInterface.bulkInsert('inventory', inventoryRows, { transaction });
      await queryInterface.bulkInsert('inventory_batches', batchRows, { transaction });
      await queryInterface.bulkInsert('stock_movements', movementRows, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_movements', null, {});
    await queryInterface.bulkDelete('inventory_batches', null, {});
    await queryInterface.bulkDelete('inventory', null, {});
  }
};
