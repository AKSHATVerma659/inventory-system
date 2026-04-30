'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('purchases', [
      {
        supplier_id: 1,        // must exist
        warehouse_id: 1,       // must exist
        invoice_no: 'PUR-0001',

        subtotal: 50000.00,
        tax_amount: 9000.00,
        total_amount: 59000.00,
        paid_amount: 0.00,

        status: 'UNPAID',
        lifecycle_status: 'CONFIRMED',

        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('purchases', {
      invoice_no: 'PUR-0001'
    });
  }
};
