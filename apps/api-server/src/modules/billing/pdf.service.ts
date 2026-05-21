import { Injectable, InternalServerErrorException } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PDFService {
  async generateInvoicePdf(invoiceData: any): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .title { font-size: 24px; font-weight: 900; color: #0f172a; }
              .info { margin-top: 20px; display: flex; justify-content: space-between; }
              table { width: 100%; border-collapse: collapse; margin-top: 30px; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
              th { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; }
              .totals { margin-top: 30px; width: 300px; float: right; }
              .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
              .grand-total { font-size: 18px; font-weight: 900; color: #14b8a6; border-top: 2px solid #e2e8f0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">INVOICE</div>
                <div style="color: #64748b; font-size: 12px; padding-top: 4px;">#${invoiceData.invoiceNumber}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700;">${invoiceData.branch.name}</div>
                <div style="color: #64748b; font-size: 12px;">Contact: ${invoiceData.branch.contact}</div>
                <div style="color: #64748b; font-size: 12px; font-weight: bold;">GSTIN: ${invoiceData.branch.hospital.gstin || 'N/A'}</div>
              </div>
            </div>
            
            <div class="info">
              <div>
                <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Billed To</div>
                <div style="font-weight: 700; margin-top: 4px;">${invoiceData.patient.user.name}</div>
                <div style="color: #64748b; font-size: 12px;">UHID: ${invoiceData.patient.uhid}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Date</div>
                <div style="font-weight: 700; margin-top: 4px;">${new Date(invoiceData.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map((item: any) => `
                  <tr>
                    <td style="font-weight: 600;">${item.serviceName}</td>
                    <td>${item.quantity}</td>
                    <td>₹${Number(item.unitPrice).toFixed(2)}</td>
                    <td>₹${Number(item.taxAmount).toFixed(2)}</td>
                    <td style="font-weight: 700;">₹${Number(item.totalAmount).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row"><span>Subtotal</span> <span style="font-weight: 600;">₹${Number(invoiceData.subTotal).toFixed(2)}</span></div>
              <div class="total-row"><span>Tax Total</span> <span style="font-weight: 600;">₹${Number(invoiceData.taxTotal).toFixed(2)}</span></div>
              ${Number(invoiceData.discount) > 0 ? `<div class="total-row" style="color: #ef4444;"><span>Discount</span> <span>-₹${Number(invoiceData.discount).toFixed(2)}</span></div>` : ''}
              <div class="total-row grand-total"><span>Grand Total</span> <span>₹${Number(invoiceData.grandTotal).toFixed(2)}</span></div>
            </div>
          </body>
        </html>
      `;
      
      await page.setContent(htmlContent, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new InternalServerErrorException('Failed to generate PDF');
    }
  }
}
