const twilio = require('twilio');
const inventoryService = require('../services/inventoryService');

/* ===============================
   TWILIO CLIENT (SANDBOX)
================================ */
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ===============================
   SEND STOCK SUMMARY (WHATSAPP)
================================ */
exports.sendStockSummary = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryWithLastMovement();

    const lowStockItems = inventory.filter(
      i => Number(i.quantity) <= Number(i.min_quantity)
    );

    let message = `📦 Inventory Stock Summary\n\n`;

    if (lowStockItems.length === 0) {
      message += `✅ All products are sufficiently stocked.\nNo low stock items at the moment.`;
    } else {
      message += `⚠️ Low Stock Items (${lowStockItems.length})\n\n`;

      lowStockItems.slice(0, 10).forEach((item, idx) => {
        message += `${idx + 1}. ${item.product}\n`;
        message += `   Qty: ${item.quantity} | Min: ${item.min_quantity}\n`;
        message += `   Warehouse: ${item.warehouse}\n\n`;
      });

      if (lowStockItems.length > 10) {
        message += `…and ${lowStockItems.length - 10} more items.\n`;
      }
    }

    await client.messages.create({
      from: 'whatsapp:+14155238886', // sandbox
      to: process.env.ADMIN_WHATSAPP_NUMBER,
      body: message
    });

    res.json({
      success: true,
      message: 'Stock summary sent via WhatsApp'
    });
  } catch (err) {
    console.error('Stock summary WhatsApp error:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to send stock summary',
      details: err.message
    });
  }
};
