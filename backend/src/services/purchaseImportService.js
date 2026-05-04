const fs = require('fs');
const csv = require('csv-parser');
const sequelize = require('../config/database');

const ImportJob = require('../models/ImportJob');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');

const BATCH_SIZE = 200;

exports.processPurchaseImport = async (importJobId) => {
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
      // Group rows by invoice_no
      const invoiceMap = {};

      for (const row of batch) {
        if (!invoiceMap[row.invoice_no]) {
          invoiceMap[row.invoice_no] = [];
        }
        invoiceMap[row.invoice_no].push(row);
      }

      for (const invoiceNo of Object.keys(invoiceMap)) {
        try {
          const lines = invoiceMap[invoiceNo];
          const first = lines[0];

          const warehouse = await Warehouse.findOne({
            where: { name: first.warehouse },
            transaction: t
          });

          if (!warehouse) {
            throw new Error(`Invalid warehouse: ${first.warehouse}`);
          }

          // ✅ CREATE PURCHASE AS DRAFT (NOT CONFIRMED)
          const purchase = await Purchase.create({
            invoice_no: invoiceNo,
            warehouse_id: warehouse.id,
            lifecycle_status: 'DRAFT',
            status: 'UNPAID',
            paid_amount: 0,
            total_amount: 0,
            created_by: importJob.created_by
          }, { transaction: t });

          let totalAmount = 0;

          for (const line of lines) {
            totalRows++;

            const product = await Product.findOne({
              where: { sku: line.sku },
              transaction: t
            });

            if (!product) {
              throw new Error(`Invalid SKU: ${line.sku}`);
            }

            const qty = Number(line.quantity);
            const cost = Number(line.unit_cost);

            if (qty <= 0 || cost < 0) {
              throw new Error(`Invalid quantity or cost for SKU ${line.sku}`);
            }

            const lineTotal = qty * cost;
            totalAmount += lineTotal;

            await PurchaseItem.create({
              purchase_id: purchase.id,
              product_id: product.id,
              quantity: qty,
              unit_price: cost,
              total_price: lineTotal
            }, { transaction: t });

            successRows++;
          }

          // ✅ Update totals ONLY (no inventory, no stock, no FIFO)
          await purchase.update(
            { total_amount: totalAmount },
            { transaction: t }
          );

        } catch (err) {
          failedRows += invoiceMap[invoiceNo].length;
          invoiceMap[invoiceNo].forEach(r =>
            errorRows.push({ ...r, error: err.message })
          );
        }
      }
    });

    batch = [];
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream(importJob.file_path)
      .pipe(csv())
      .on('data', (row) => {
        batch.push(row);
        if (batch.length >= BATCH_SIZE) {
          this.pause?.();
          flushBatch()
            .then(() => this.resume?.())
            .catch(reject);
        }
      })
      .on('end', async () => {
        try {
          await flushBatch();

          let errorFilePath = null;
          if (errorRows.length > 0) {
            errorFilePath = importJob.file_path.replace('.csv', '_errors.csv');
            const headers = Object.keys(errorRows[0]).join(',');
            const lines = errorRows.map(r => Object.values(r).join(','));
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
