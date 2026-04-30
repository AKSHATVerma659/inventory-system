const ExcelJS = require('exceljs');
const { Product } = require('../models');

exports.importProductsFromExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];

  const products = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const [sku, name, cost_price, selling_price] = row.values.slice(1);

    if (!sku || !name) return;

    products.push({
      sku,
      name,
      cost_price,
      selling_price,
      is_active: true
    });
  });

  await Product.bulkCreate(products, { ignoreDuplicates: true });

  return products.length;
};
