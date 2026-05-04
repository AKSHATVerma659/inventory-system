'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ----------------------------
    // SALE 1 - INTRA-STATE (CGST + SGST)
    // ----------------------------
    await queryInterface.bulkInsert('sales', [
      {
        id: 301,
        invoice_no: 'INV-GST-001',
        customer_id: 1,                // John Customer (GST)
        warehouse_id: 1,
        status: 'CONFIRMED',
        lifecycle_status: 'CONFIRMED',
        taxable_value: 22500.00,
        cgst_amount: 2025.00,
        sgst_amount: 2025.00,
        igst_amount: 0.00,
        tax_amount: 4050.00,
        total_amount: 26550.00,
        is_interstate: 0,
        place_of_supply: 'Maharashtra',
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('sale_items', [
      {
        sale_id: 301,
        product_id: 1,               // Product id 1 (Laptop or whatever exists)
        quantity: 36,
        unit_price: 625.00,
        cost_amount: 18000.00,       // COGS for this item (for your records)
        total_price: 22500.00,
        gst_rate: 18.00,
        hsn_code: '84713010',
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert('stock_movements', [
      {
        product_id: 1,
        warehouse_id: 1,
        change: -36,
        movement_type: 'OUT',
        reference_type: 'SALE',
        reference_id: 301,
        reason: 'Seeded confirmed sale (CGST/SGST)',
        created_at: now
      }
    ]);

    // ----------------------------
    // SALE 2 - INTER-STATE (IGST)
    // ----------------------------
    await queryInterface.bulkInsert('sales', [
      {
        id: 302,
        invoice_no: 'INV-GST-002',
        customer_id: 2,                // Walk-in (no GST) as example - IGST still demonstrable if needed
        warehouse_id: 1,
        status: 'CONFIRMED',
        lifecycle_status: 'CONFIRMED',
        taxable_value: 4000.00,
        cgst_amount: 0.00,
        sgst_amount: 0.00,
        igst_amount: 720.00,
        tax_amount: 720.00,
        total_amount: 4720.00,
        is_interstate: 1,
        place_of_supply: 'Karnataka',
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('sale_items', [
      {
        sale_id: 302,
        product_id: 2,
        quantity: 2,
        unit_price: 2000.00,
        cost_amount: 1200.00,
        total_price: 4000.00,
        gst_rate: 18.00,
        hsn_code: '84716020',
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert('stock_movements', [
      {
        product_id: 2,
        warehouse_id: 1,
        change: -2,
        movement_type: 'OUT',
        reference_type: 'SALE',
        reference_id: 302,
        reason: 'Seeded confirmed sale (IGST)',
        created_at: now
      }
    ]);

    // ----------------------------
    // SALE 3 - INTRA-STATE (CGST + SGST) multi-line
    // ----------------------------
    await queryInterface.bulkInsert('sales', [
      {
        id: 303,
        invoice_no: 'INV-GST-003',
        customer_id: 1,
        warehouse_id: 1,
        status: 'CONFIRMED',
        lifecycle_status: 'CONFIRMED',
        taxable_value: 10000.00,
        cgst_amount: 900.00,
        sgst_amount: 900.00,
        igst_amount: 0.00,
        tax_amount: 1800.00,
        total_amount: 11800.00,
        is_interstate: 0,
        place_of_supply: 'Maharashtra',
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('sale_items', [
      {
        sale_id: 303,
        product_id: 3,
        quantity: 5,
        unit_price: 1000.00,
        cost_amount: 4000.00,
        total_price: 5000.00,
        gst_rate: 18.00,
        hsn_code: '8471AAAA',
        created_at: now
      },
      {
        sale_id: 303,
        product_id: 4,
        quantity: 5,
        unit_price: 1000.00,
        cost_amount: 4000.00,
        total_price: 5000.00,
        gst_rate: 18.00,
        hsn_code: '8471BBBB',
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert('stock_movements', [
      {
        product_id: 3,
        warehouse_id: 1,
        change: -5,
        movement_type: 'OUT',
        reference_type: 'SALE',
        reference_id: 303,
        reason: 'Seeded confirmed sale (multi-line)',
        created_at: now
      },
      {
        product_id: 4,
        warehouse_id: 1,
        change: -5,
        movement_type: 'OUT',
        reference_type: 'SALE',
        reference_id: 303,
        reason: 'Seeded confirmed sale (multi-line)',
        created_at: now
      }
    ]);

  },

  async down(queryInterface) {
    // Remove the seeded stock movements then sale_items then sales
    await queryInterface.bulkDelete('stock_movements', { reference_type: 'SALE', reference_id: [301, 302, 303] });
    await queryInterface.bulkDelete('sale_items', { sale_id: [301, 302, 303] });
    await queryInterface.bulkDelete('sales', { id: [301, 302, 303] });
  }
};
