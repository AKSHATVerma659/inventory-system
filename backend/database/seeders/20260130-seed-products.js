'use strict';

/**
 * ERP Product Seeder
 * -------------------
 * - Clean, GST-safe, FIFO-compatible product data
 * - No randomness, deterministic output
 * - Designed for Phase A: Reset & Seed
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const GST_RATES = [0, 5, 12, 18, 28];

    const PRODUCT_CATALOG = [
      { name: 'Laptop', hsn: '847130', gst: 18 },
      { name: 'Desktop Computer', hsn: '847150', gst: 18 },
      { name: 'Monitor', hsn: '852852', gst: 18 },
      { name: 'Keyboard', hsn: '847160', gst: 18 },
      { name: 'Mouse', hsn: '847160', gst: 18 },
      { name: 'Printer', hsn: '844332', gst: 18 },
      { name: 'Scanner', hsn: '847160', gst: 18 },
      { name: 'Router', hsn: '851762', gst: 18 },
      { name: 'Switch', hsn: '851762', gst: 18 },
      { name: 'External Hard Drive', hsn: '847170', gst: 18 },
      { name: 'SSD Drive', hsn: '847170', gst: 18 },
      { name: 'RAM Module', hsn: '847330', gst: 18 },
      { name: 'Power Adapter', hsn: '850440', gst: 18 },
      { name: 'UPS', hsn: '850440', gst: 18 },
      { name: 'Webcam', hsn: '852580', gst: 18 },
      { name: 'Headphones', hsn: '851830', gst: 18 },
      { name: 'Speaker', hsn: '851822', gst: 18 },
      { name: 'POS Machine', hsn: '847050', gst: 18 },
      { name: 'Barcode Scanner', hsn: '847160', gst: 18 },
      { name: 'Thermal Printer', hsn: '844332', gst: 18 }
    ];

    const products = [];

    let skuCounter = 1;

    for (let i = 0; i < 100; i++) {
      const base = PRODUCT_CATALOG[i % PRODUCT_CATALOG.length];

      const costPrice = 500 + i * 37; // deterministic, increasing
      const sellingPrice = +(costPrice * 1.25).toFixed(2); // fixed margin

      products.push({
        sku: `PRD-${String(skuCounter).padStart(4, '0')}`,
        name: `${base.name} ${Math.floor(i / PRODUCT_CATALOG.length) + 1}`,
        description: `${base.name} - ERP seeded product`,
        category_id: null,
        brand_id: null,
        unit_id: null,
        cost_price: costPrice.toFixed(2),
        selling_price: sellingPrice,
        hsn_code: base.hsn,
        gst_rate: base.gst,
        barcode: null,
        is_active: true,
        created_at: now,
        updated_at: now
      });

      skuCounter++;
    }

    await queryInterface.bulkInsert('products', products, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', {
      sku: {
        [Sequelize.Op.like]: 'PRD-%'
      }
    });
  }
};
