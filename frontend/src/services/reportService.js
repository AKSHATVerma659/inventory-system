const { sequelize } = require('../models');

exports.toCSV = (rows) => {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => `"${r[h] ?? ''}"`).join(',')
    )
  ];
  return lines.join('\n');
};

exports.salesReport = async () => {
  const [rows] = await sequelize.query(`
    SELECT DATE(created_at) as date, SUM(total_amount) as sales
    FROM sales
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);
  return rows;
};

exports.inventoryReport = async () => {
  const [rows] = await sequelize.query(`
    SELECT 
      p.name as product,
      i.quantity,
      i.min_quantity
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    ORDER BY p.name
  `);
  return rows;
};

exports.purchasesExport = async () => {
  const [rows] = await sequelize.query(`
    SELECT 
      invoice_no,
      total_amount,
      paid_amount,
      status,
      created_at
    FROM purchases
    ORDER BY id DESC
  `);
  return rows;
};

