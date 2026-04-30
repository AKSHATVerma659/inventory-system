const fs = require('fs');
const csv = require('csv-parser');
const { Product, ImportJob } = require('../models');

const BATCH_SIZE = 500;

async function processProductImport(importJobId) {
  const importJob = await ImportJob.findByPk(importJobId);
  if (!importJob) throw new Error('Import job not found');

  await importJob.update({ status: 'PROCESSING' });

  const filePath = importJob.file_path;

  let total = 0;
  let success = 0;
  let failed = 0;

  let batch = [];
  const errorRows = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    try {
      await Product.bulkCreate(batch, {
        ignoreDuplicates: true
      });
      success += batch.length;
    } catch (err) {
      // If bulk insert fails, mark all rows in this batch as failed
      for (const row of batch) {
        failed++;
        errorRows.push({ ...row, error: err.message });
      }
    } finally {
      batch = [];
    }
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        total++;

        const product = {
          sku: row.sku?.trim(),
          name: row.name?.trim(),
          cost_price: row.cost_price || 0,
          selling_price: row.selling_price || 0,
          is_active: true
        };

        // Validation
        if (!product.sku || !product.name) {
          failed++;
          errorRows.push({ ...row, error: 'Missing sku or name' });
          return;
        }

        batch.push(product);

        if (batch.length >= BATCH_SIZE) {
          // Pause stream while flushing batch
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
            errorFilePath = filePath.replace('.csv', '_errors.csv');
            const headers = Object.keys(errorRows[0]).join(',');
            const lines = errorRows.map(r =>
              Object.values(r).join(',')
            );
            fs.writeFileSync(errorFilePath, [headers, ...lines].join('\n'));
          }

          await importJob.update({
            status: 'COMPLETED',
            total_rows: total,
            success_rows: success,
            failed_rows: failed,
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
}

module.exports = { processProductImport };
