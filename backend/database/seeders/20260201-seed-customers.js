'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Insert customers (business entities)
    await queryInterface.bulkInsert('customers', [
      {
        id: 1,
        name: 'John Customer',
        email: 'john@test.com',
        phone: '8888888888',
        address: null,
        gstin: '27ABCDE1234F1Z5',      // gst customer
        place_of_supply: 'Maharashtra',
        is_active: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'Walk-in Customer',
        email: null,
        phone: null,
        address: null,
        gstin: null,                  // retail / walk-in (no GST)
        place_of_supply: 'Maharashtra',
        is_active: 1,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('customers', {
      id: [1, 2]
    });
  }
};
