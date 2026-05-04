const reportService = require('../services/reportService');
const XLSX = require('xlsx');

/* ======================
   CORE REPORT APIs
====================== */

exports.sales = async (req, res) => {
  try {
    const rows = await reportService.salesReport();
    res.json(rows.map(r => ({
      date: r.date,
      total: Number(r.total)
    })));
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};

exports.inventory = async (req, res) => {
  try {
    const data = await reportService.inventoryReport();
    res.json(data);
  } catch (err) {
    console.error('Inventory report error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
};

exports.purchasesReport = async (req, res) => {
  try {
    const rows = await reportService.purchasesReport();
    res.json(rows.map(r => ({
      date: r.date,
      total: Number(r.total)
    })));
  } catch (err) {
    console.error('Purchases report error:', err);
    res.status(500).json({ error: 'Failed to fetch purchases report' });
  }
};

exports.purchaseQuantityReport = async (req, res) => {
  try {
    const rows = await reportService.purchaseQuantityReport();
    res.json(rows.map(r => ({
      date: r.date,
      total_quantity: Number(r.total_quantity)
    })));
  } catch (err) {
    console.error('Purchase quantity report error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase quantity report' });
  }
};

exports.combinedReport = async (req, res) => {
  try {
    const rows = await reportService.combinedReport();
    res.json(rows.map(r => ({
      date: r.date,
      sales: Number(r.sales),
      purchases: Number(r.purchases)
    })));
  } catch (err) {
    console.error('Combined report error:', err);
    res.status(500).json({ error: 'Failed to fetch combined report' });
  }
};

/* ======================
   FINANCIAL REPORTS
====================== */

exports.revenue = async (req, res) => {
  try {
    const { from = null, to = null } = req.query;
    const rows = await reportService.revenueReport(from, to);
    res.json(rows);
  } catch (err) {
    console.error('Revenue report error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
};

exports.cogs = async (req, res) => {
  try {
    const { from = null, to = null } = req.query;
    const rows = await reportService.cogsReport(from, to);
    res.json(rows);
  } catch (err) {
    console.error('COGS report error:', err);
    res.status(500).json({ error: 'Failed to fetch COGS report' });
  }
};

exports.profit = async (req, res) => {
  try {
    const { from = null, to = null } = req.query;
    const rows = await reportService.profitReport(from, to);
    res.json(rows);
  } catch (err) {
    console.error('Profit report error:', err);
    res.status(500).json({ error: 'Failed to fetch profit report' });
  }
};

/* ======================
   INVENTORY VALUE
====================== */

exports.inventoryValuation = async (req, res) => {
  try {
    const row = await reportService.inventoryValuationReport();
    res.json(row || { inventory_value: 0 });
  } catch (err) {
    console.error('Inventory valuation error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory valuation' });
  }
};

exports.inventoryValue = async (req, res) => {
  try {
    const row = await reportService.inventoryValuationReport();
    res.json({ inventory_value: Number(row?.inventory_value || 0) });
  } catch (err) {
    console.error('Inventory value error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory value' });
  }
};

exports.inventoryValueByProduct = async (req, res) => {
  try {
    const rows = await reportService.inventoryValueByProduct();
    res.json(rows);
  } catch (err) {
    console.error('Inventory value by product error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory value by product' });
  }
};

exports.inventoryValueByWarehouse = async (req, res) => {
  try {
    const rows = await reportService.inventoryValueByWarehouse();
    res.json(rows);
  } catch (err) {
    console.error('Inventory value by warehouse error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory value by warehouse' });
  }
};

/* ======================
   GST REPORTS
====================== */

exports.gstr1 = async (req, res) => {
  try {
    const rows = await reportService.gstr1Report();
    return sendCSV(res, 'gstr1_report.csv', rows);
  } catch (err) {
    console.error('GSTR-1 export error:', err);
    res.status(500).json({ error: 'Failed to generate GSTR-1 report' });
  }
};

exports.hsn = async (req, res) => {
  try {
    const rows = await reportService.hsnSummaryReport();
    return sendCSV(res, 'hsn_summary.csv', rows);
  } catch (err) {
    console.error('HSN summary export error:', err);
    res.status(500).json({ error: 'Failed to generate HSN summary' });
  }
};

/* ======================
   EXPORT HELPERS
====================== */

const sendCSV = (res, filename, rows) => {
  if (!rows || !rows.length) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.type('text/csv');
    return res.send('');
  }

  const plainRows = rows.map(r => (r.toJSON ? r.toJSON() : r));
  const headers = Object.keys(plainRows[0]);

  const csv = [
    headers.join(','),
    ...plainRows.map(row =>
      headers.map(h => `"${row[h] ?? ''}"`).join(',')
    )
  ].join('\n');

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.type('text/csv');
  res.send(csv);
};

const sendXLSX = (res, filename, rows, sheetName) => {
  const plainRows = rows.map(r => (r.toJSON ? r.toJSON() : r));
  const ws = XLSX.utils.json_to_sheet(plainRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.type(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buffer);
};

/* ======================
   EXPORT ENDPOINTS
====================== */

exports.exportSales = async (req, res) => {
  try {
    const rows = await reportService.salesReport();
    const format = req.query.format || 'csv';
    return format === 'xlsx'
      ? sendXLSX(res, 'sales_report.xlsx', rows, 'Sales')
      : sendCSV(res, 'sales_report.csv', rows);
  } catch (err) {
    console.error('Export sales error:', err);
    res.status(500).json({ error: 'Failed to export sales report' });
  }
};

exports.exportInventory = async (req, res) => {
  try {
    const rows = await reportService.inventoryReport();
    const format = req.query.format || 'csv';
    return format === 'xlsx'
      ? sendXLSX(res, 'inventory_report.xlsx', rows, 'Inventory')
      : sendCSV(res, 'inventory_report.csv', rows);
  } catch (err) {
    console.error('Export inventory error:', err);
    res.status(500).json({ error: 'Failed to export inventory report' });
  }
};

exports.exportPurchases = async (req, res) => {
  try {
    const rows = await reportService.purchasesReport();
    const format = req.query.format || 'csv';
    return format === 'xlsx'
      ? sendXLSX(res, 'purchases_report.xlsx', rows, 'Purchases')
      : sendCSV(res, 'purchases_report.csv', rows);
  } catch (err) {
    console.error('Export purchases error:', err);
    res.status(500).json({ error: 'Failed to export purchases report' });
  }
};

exports.exportCombined = async (req, res) => {
  try {
    const rows = await reportService.combinedReport();
    return sendCSV(res, 'sales_vs_purchases.csv', rows);
  } catch (err) {
    console.error('Export combined error:', err);
    res.status(500).json({ error: 'Failed to export combined report' });
  }
};
