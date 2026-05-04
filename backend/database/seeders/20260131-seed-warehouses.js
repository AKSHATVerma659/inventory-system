'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('warehouses', [
      {
        name: 'Main Warehouse',
        location: 'HQ',
        is_active: true,
        created_at: new Date()
      },
      {
        name: 'Secondary Warehouse',
        location: 'Branch',
        is_active: true,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('warehouses', null, {});
  }
};
