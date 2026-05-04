const inventoryService = require('../services/inventoryService');

exports.listInventory = async (req, res) => {
  try {
    const data = await inventoryService.getInventoryWithLastMovement();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load inventory' });
  }
};

exports.inventoryTimeline = async (req, res) => {
  try {
    const { productId, warehouseId } = req.params;
    const data = await inventoryService.getMovementTimeline(
      productId,
      warehouseId
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timeline' });
  }
};

// 🔥 STEP 16 — WAREHOUSE TRANSFER
exports.transferStock = async (req, res) => {
  try {
    const {
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reason
    } = req.body;

    await inventoryService.transferStock({
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reason,
      user_id: req.user.id
    });

    res.status(200).json({ message: 'Stock transferred successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
