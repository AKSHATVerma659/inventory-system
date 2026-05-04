const { processSaleReturn } = require('../services/saleReturnService');

exports.createSaleReturn = async (req, res) => {
  try {
    const { saleId, items } = req.body;

    if (!saleId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid return request' });
    }

    // basic payload validation for items
    for (const it of items) {
      if (!it.sale_item_id || !(Number(it.quantity) > 0)) {
        return res.status(400).json({ message: 'Each return item must contain sale_item_id and positive quantity' });
      }
    }

    const result = await processSaleReturn({
      saleId,
      items,
      userId: req.user?.id || null
    });

    return res.status(200).json({
      message: 'Sale return processed successfully',
      result
    });

  } catch (error) {
    console.error('Sale return error:', error);
    return res.status(400).json({ message: error.message });
  }
};
