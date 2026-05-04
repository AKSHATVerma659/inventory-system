const pdfService = require('../services/pdfService');

exports.salesPDF = async (req, res) => {
  try {
    await pdfService.exportSalesPDF(res);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};
