const ExcelJS = require('exceljs');
const { Inventory, Product } = require('../models');

exports.exportInventoryToExcel = async (res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');

  sheet.columns = [
    { header: 'SKU', key: 'sku' },
    { header: 'Product', key: 'name' },
    { header: 'Quantity', key: 'quantity' }
  ];

  const inventory = await Inventory.findAll({
    include: Product
  });

  inventory.forEach(i => {
    sheet.addRow({
      sku: i.product.sku,
      name: i.product.name,
      quantity: i.quantity
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=inventory.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
};
