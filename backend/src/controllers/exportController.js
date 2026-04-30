const exportService = require('../services/exportService');

exports.inventoryExcel = async (req, res) => {
  try {
    await exportService.exportInventoryToExcel(res);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to generate export' });
  }
};
