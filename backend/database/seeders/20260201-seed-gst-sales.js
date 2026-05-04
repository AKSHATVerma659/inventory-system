'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // SALES
    await queryInterface.bulkInsert('sales', [
      {
        id: 201,
        invoice_no: 'INV-GST-001',
        customer_id: 101,
        warehouse_id: 1,
        status: 'UNPAID',
        lifecycle_status: 'CONFIRMED',
        taxable_value: 22500,
        cgst_amount: 2025,
        sgst_amount: 2025,
        igst_amount: 0,
        tax_amount: 4050,
        is_interstate: false,
        created_at: now,
        updated_at: now
      }
    ]);

    // SALE ITEMS
    await queryInterface.bulkInsert('sale_items', [
      {
        sale_id: 201,
        product_id: 1,
        quantity: 36,
        unit_price: 625,
        gst_rate: 18,
        taxable_value: 22500,
        cgst_amount: 2025,
        sgst_amount: 2025,
        igst_amount: 0,
        total_price: 26550,
        created_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sale_items', { sale_id: 201 });
    await queryInterface.bulkDelete('sales', { id: 201 });
  }
};
