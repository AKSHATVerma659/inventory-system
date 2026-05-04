const puppeteer = require('puppeteer');

const {
  Sale,
  SaleItem,
  Product,
  Warehouse
} = require('../models');

/**
 * GET /sales/:id/invoice/pdf
 * Generate GST Invoice PDF (DB-backed, audit-safe)
 */
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'sale_items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'hsn_code', 'gst_rate']
            }
          ]
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['name']
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (sale.lifecycle_status !== 'CONFIRMED') {
      return res.status(400).json({
        error: 'Invoice can only be generated for CONFIRMED sales'
      });
    }

    /* ===============================
       DB-OWNED VALUES ONLY
    =============================== */
    const invoiceNo = sale.invoice_no;
    const invoiceDate = new Date(sale.created_at).toLocaleDateString();

    const taxableValue = Number(sale.taxable_value || 0);
    const cgst = Number(sale.cgst_amount || 0);
    const sgst = Number(sale.sgst_amount || 0);
    const igst = Number(sale.igst_amount || 0);
    const total = Number(sale.total_amount || 0);

    const isInterstate = Boolean(sale.is_interstate);

    /* ===============================
       HTML TEMPLATE — GST INVOICE
    =============================== */
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      padding: 24px;
    }
    h1 {
      text-align: center;
      margin-bottom: 16px;
    }
    .meta {
      margin-bottom: 16px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th, td {
      border: 1px solid #999;
      padding: 6px;
    }
    th {
      background: #f3f3f3;
    }
    .right {
      text-align: right;
    }
    .summary {
      margin-top: 24px;
      width: 45%;
      float: right;
    }
    .footer {
      margin-top: 48px;
      font-size: 11px;
      clear: both;
    }
  </style>
</head>
<body>

  <h1>TAX INVOICE</h1>

  <div class="meta">
    <b>Invoice No:</b> ${invoiceNo}<br/>
    <b>Date:</b> ${invoiceDate}<br/>
    <b>Warehouse:</b> ${sale.warehouse?.name || 'N/A'}<br/>
    <b>Customer GSTIN:</b> ${sale.customer_gstin || 'Unregistered'}<br/>
    <b>Place of Supply:</b> ${sale.place_of_supply || 'N/A'}<br/>
    <b>Supply Type:</b> ${
      isInterstate
        ? 'Inter-State (IGST)'
        : 'Intra-State (CGST + SGST)'
    }
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description of Goods</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>GST %</th>
        <th>Taxable Value</th>
      </tr>
    </thead>
    <tbody>
      ${sale.sale_items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.product?.name || 'N/A'}</td>
          <td>${item.product?.hsn_code || '-'}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">₹ ${Number(item.unit_price).toFixed(2)}</td>
          <td class="right">${Number(item.product?.gst_rate || 0)}%</td>
          <td class="right">₹ ${Number(item.total_price).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <table>
      <tr>
        <td>Taxable Value</td>
        <td class="right">₹ ${taxableValue.toFixed(2)}</td>
      </tr>

      ${
        isInterstate
          ? `
            <tr>
              <td>IGST</td>
              <td class="right">₹ ${igst.toFixed(2)}</td>
            </tr>
          `
          : `
            <tr>
              <td>CGST</td>
              <td class="right">₹ ${cgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST</td>
              <td class="right">₹ ${sgst.toFixed(2)}</td>
            </tr>
          `
      }

      <tr>
        <th>Total Invoice Value</th>
        <th class="right">₹ ${total.toFixed(2)}</th>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>
      <b>Declaration:</b><br/>
      We declare that this invoice shows the actual price of the goods described
      and that all particulars are true and correct.
    </p>

    <p>
      <b>Note:</b> This is a computer-generated tax invoice issued under the GST Act.
    </p>

    <p style="margin-top: 32px; text-align: right;">
      <b>For Authorized Signatory</b>
    </p>
  </div>

</body>
</html>
    `;

    /* ===============================
       PDF GENERATION
    =============================== */
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice_${invoiceNo}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Invoice PDF error:', err);
    return res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
};
