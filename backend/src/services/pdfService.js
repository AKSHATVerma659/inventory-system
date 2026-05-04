const PdfPrinter = require('pdfmake');
const { Sale } = require('../models');

exports.exportSalesPDF = async (res) => {
  const sales = await Sale.findAll();

  const fonts = {
    Roboto: {
      normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf'
    }
  };

  const printer = new PdfPrinter(fonts);

  const docDefinition = {
    content: [
      { text: 'Sales Report', style: 'header' },
      ...sales.map(s =>
        `Invoice: ${s.invoice_no} | Total: ${s.total_amount} | Status: ${s.status}`
      )
    ],
    styles: {
      header: { fontSize: 18, bold: true }
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=sales.pdf');

  pdfDoc.pipe(res);
  pdfDoc.end();
};
