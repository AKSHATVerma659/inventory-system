const { sequelize, Inventory, Product, Warehouse } = require('../models');
const { QueryTypes } = require('sequelize');

/* ======================
   SALES REPORT (amount)
====================== */
async function salesReport() {
  return sequelize.query(
    `
    SELECT
      DATE(s.created_at) AS date,
      SUM(s.total_amount) AS total
    FROM sales s
    WHERE s.lifecycle_status = 'CONFIRMED'
    GROUP BY DATE(s.created_at)
    ORDER BY DATE(s.created_at)
    `,
    { type: QueryTypes.SELECT }
  );
}

/* ======================
   PURCHASES REPORT
====================== */
async function purchasesReport() {
  return sequelize.query(
    `
    SELECT
      DATE(p.created_at) AS date,
      SUM(p.total_amount) AS total
    FROM purchases p
    GROUP BY DATE(p.created_at)
    ORDER BY DATE(p.created_at)
    `,
    { type: QueryTypes.SELECT }
  );
}

async function purchaseQuantityReport() {
  return sequelize.query(
    `
    SELECT
      DATE(p.created_at) AS date,
      SUM(pi.quantity) AS total_quantity
    FROM purchases p
    JOIN purchase_items pi ON pi.purchase_id = p.id
    GROUP BY DATE(p.created_at)
    ORDER BY DATE(p.created_at)
    `,
    { type: QueryTypes.SELECT }
  );
}

/* ======================
   COMBINED REPORT
====================== */
async function combinedReport() {
  return sequelize.query(
    `
    SELECT
      d.date,
      COALESCE(s.total_sales, 0) AS sales,
      COALESCE(p.total_purchases, 0) AS purchases
    FROM (
      SELECT DATE(created_at) AS date FROM sales WHERE lifecycle_status = 'CONFIRMED'
      UNION
      SELECT DATE(created_at) AS date FROM purchases
    ) d
    LEFT JOIN (
      SELECT DATE(created_at) AS date, SUM(total_amount) AS total_sales
      FROM sales
      WHERE lifecycle_status = 'CONFIRMED'
      GROUP BY DATE(created_at)
    ) s ON s.date = d.date
    LEFT JOIN (
      SELECT DATE(created_at) AS date, SUM(total_amount) AS total_purchases
      FROM purchases
      GROUP BY DATE(created_at)
    ) p ON p.date = d.date
    ORDER BY d.date
    `,
    { type: QueryTypes.SELECT }
  );
}

/* ======================
   INVENTORY REPORT
====================== */
async function inventoryReport() {
  const rows = await sequelize.query(
    `
    SELECT
      i.id,
      p.name AS product,
      w.name AS warehouse,
      i.quantity,
      i.min_quantity
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    JOIN warehouses w ON w.id = i.warehouse_id
    ORDER BY p.name
    `,
    { type: QueryTypes.SELECT }
  );

  return rows.map(r => ({
    id: r.id,
    product: r.product,
    warehouse: r.warehouse,
    quantity: Number(r.quantity),
    min_quantity: Number(r.min_quantity || 0)
  }));
}

/* ======================
   FINANCIAL REPORTS
====================== */
async function revenueReport(from = null, to = null) {
  return sequelize.query(
    `
    SELECT
      DATE(created_at) AS date,
      SUM(total_amount) AS revenue
    FROM sales
    WHERE lifecycle_status = 'CONFIRMED'
      AND (:from IS NULL OR created_at >= :from)
      AND (:to IS NULL OR created_at <= :to)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
    `,
    { replacements: { from, to }, type: QueryTypes.SELECT }
  );
}

async function cogsReport(from = null, to = null) {
  return sequelize.query(
    `
    SELECT
      DATE(s.created_at) AS date,
      SUM(si.cost_amount) AS cogs
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE s.lifecycle_status = 'CONFIRMED'
      AND (:from IS NULL OR s.created_at >= :from)
      AND (:to IS NULL OR s.created_at <= :to)
    GROUP BY DATE(s.created_at)
    ORDER BY DATE(s.created_at)
    `,
    { replacements: { from, to }, type: QueryTypes.SELECT }
  );
}

async function profitReport(from = null, to = null) {
  return sequelize.query(
    `
    SELECT
      r.date,
      r.revenue,
      c.cogs,
      (r.revenue - c.cogs) AS gross_profit,
      CASE
        WHEN r.revenue = 0 THEN 0
        ELSE ROUND(((r.revenue - c.cogs) / r.revenue) * 100, 2)
      END AS gross_margin_percent
    FROM (
      SELECT DATE(created_at) AS date, SUM(total_amount) AS revenue
      FROM sales
      WHERE lifecycle_status = 'CONFIRMED'
        AND (:from IS NULL OR created_at >= :from)
        AND (:to IS NULL OR created_at <= :to)
      GROUP BY DATE(created_at)
    ) r
    LEFT JOIN (
      SELECT DATE(s.created_at) AS date, SUM(si.cost_amount) AS cogs
      FROM sales s
      JOIN sale_items si ON si.sale_id = s.id
      WHERE s.lifecycle_status = 'CONFIRMED'
        AND (:from IS NULL OR s.created_at >= :from)
        AND (:to IS NULL OR s.created_at <= :to)
      GROUP BY DATE(s.created_at)
    ) c ON r.date = c.date
    ORDER BY r.date
    `,
    { replacements: { from, to }, type: QueryTypes.SELECT }
  );
}

/* ======================
   INVENTORY VALUATION
====================== */
async function inventoryValuationReport() {
  const [row] = await sequelize.query(
    `
    SELECT
      SUM(quantity_remaining * unit_cost) AS inventory_value
    FROM inventory_batches
    `,
    { type: QueryTypes.SELECT }
  );
  return row;
}

async function inventoryValueByProduct() {
  return sequelize.query(
    `
    SELECT
      p.id AS product_id,
      p.name AS product,
      SUM(b.quantity_remaining) AS qty_on_hand,
      SUM(b.quantity_remaining * b.unit_cost) AS stock_value
    FROM inventory_batches b
    JOIN products p ON p.id = b.product_id
    GROUP BY b.product_id, p.name
    ORDER BY p.name
    `,
    { type: QueryTypes.SELECT }
  );
}

async function inventoryValueByWarehouse() {
  return sequelize.query(
    `
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse,
      SUM(b.quantity_remaining) AS qty_on_hand,
      SUM(b.quantity_remaining * b.unit_cost) AS stock_value
    FROM inventory_batches b
    JOIN warehouses w ON w.id = b.warehouse_id
    GROUP BY b.warehouse_id, w.name
    ORDER BY w.name
    `,
    { type: QueryTypes.SELECT }
  );
}

/* ======================
   🔥 GST REPORTS (NEW)
====================== */

/**
 * GSTR-1 — Outward supplies
 */
async function gstr1Report() {
  return sequelize.query(
    `
    SELECT
      s.invoice_no,
      DATE(s.created_at) AS invoice_date,
      s.customer_gstin,
      s.place_of_supply,
      s.taxable_value,
      s.cgst_amount,
      s.sgst_amount,
      s.igst_amount,
      s.tax_amount,
      s.total_amount
    FROM sales s
    WHERE s.lifecycle_status = 'CONFIRMED'
    ORDER BY s.created_at
    `,
    { type: QueryTypes.SELECT }
  );
}

/**
 * HSN-wise GST summary
 */
async function hsnSummaryReport() {
  return sequelize.query(
    `
    SELECT
      p.hsn_code,
      SUM(si.quantity) AS total_quantity,
      SUM(si.total_price) AS taxable_value,
      SUM(s.cgst_amount) AS cgst,
      SUM(s.sgst_amount) AS sgst,
      SUM(s.igst_amount) AS igst
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.lifecycle_status = 'CONFIRMED'
    GROUP BY p.hsn_code
    ORDER BY p.hsn_code
    `,
    { type: QueryTypes.SELECT }
  );
}

module.exports = {
  salesReport,
  purchasesReport,
  purchaseQuantityReport,
  combinedReport,
  inventoryReport,
  revenueReport,
  cogsReport,
  profitReport,
  inventoryValuationReport,
  inventoryValueByProduct,
  inventoryValueByWarehouse,
  gstr1Report,
  hsnSummaryReport
};
