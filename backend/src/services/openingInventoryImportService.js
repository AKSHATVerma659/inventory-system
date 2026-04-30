const fs = require('fs');
const csv = require('csv-parser');
const sequelize = require('../config/database');

const ImportJob = require('../models/ImportJob');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const InventoryBatch = require('../models/InventoryBatch');
const StockMovement = require('../models/StockMovement');

const BATCH_SIZE = 300;

exports.processOpeningInventoryImport = async (importJobId) => {
  const importJob = await ImportJob.findByPk(importJobId);
  if (!importJob) return;

  await importJob.update({ status: 'PROCESSING' });

  let totalRows = 0;
  let successRows = 0;
  let failedRows = 0;

  const errorRows = [];
  let batch = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    await sequelize.transaction(async (t) => {
      for (const row of batch) {
        try {
          const { sku, warehouse, quantity, min_quantity, unit_cost } = row;

          if (!sku || !warehouse || !quantity) {
            throw new Error('Missing required fields');
          }

          const product = await Product.findOne({
            where: { sku },
            transaction: t
          });
          if (!product) throw new Error(`Invalid SKU: ${sku}`);

          const warehouseRow = await Warehouse.findOne({
            where: { name: warehouse },
            transaction: t
          });
          if (!warehouseRow) throw new Error(`Invalid warehouse: ${warehouse}`);

          const qty = Number(quantity);
          const minQty = Number(min_quantity || 0);
          const cost = Number(unit_cost || product.cost_price || 0);

          // Inventory snapshot (UPSERT)
          const [inventory, created] = await Inventory.findOrCreate({
            where: {
              product_id: product.id,
              warehouse_id: warehouseRow.id
            },
            defaults: {
              quantity: qty,
              min_quantity: minQty
            },
            transaction: t
          });

          if (!created) {
            await inventory.update(
              {
                quantity: inventory.quantity + qty,
                min_quantity: minQty
              },
              { transaction: t }
            );
          }

          // Stock ledger (OPENING)
          await StockMovement.create({
            product_id: product.id,
            warehouse_id: warehouseRow.id,
            change: qty,
            movement_type: 'IN',
            reference_type: 'OPENING',
            reference_id: importJob.id,
            reason: 'Opening inventory import',
            user_id: importJob.created_by
          }, { transaction: t });

          // FIFO batch
          await InventoryBatch.create({
            product_id: product.id,
            warehouse_id: warehouseRow.id,
            source_type: 'OPENING',
            source_id: importJob.id,
            quantity_remaining: qty,
            unit_cost: cost
          }, { transaction: t });

          successRows++;
        } catch (err) {
          failedRows++;
          errorRows.push({ ...row, error: err.message });
        }
      }
    });

    batch = [];
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream(importJob.file_path)
      .pipe(csv())
      .on('data', async (row) => {
        totalRows++;
        batch.push(row);

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      })
      .on('end', async () => {
        try {
          await flushBatch();

          let errorFilePath = null;
          if (errorRows.length > 0) {
            errorFilePath = importJob.file_path.replace('.csv', '_errors.csv');
            const headers = Object.keys(errorRows[0]).join(',');
            const lines = errorRows.map(r =>
              Object.values(r).join(',')
            );
            fs.writeFileSync(errorFilePath, [headers, ...lines].join('\n'));
          }

          await importJob.update({
            status: 'COMPLETED',
            total_rows: totalRows,
            success_rows: successRows,
            failed_rows: failedRows,
            error_file_path: errorFilePath
          });

          resolve();
        } catch (err) {
          await importJob.update({ status: 'FAILED' });
          reject(err);
        }
      })
      .on('error', async (err) => {
        await importJob.update({ status: 'FAILED' });
        reject(err);
      });
  });
};
