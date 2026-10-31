import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import { config } from './config.js';
export async function sendMail({ to, subject, text, attachments = [] }) {
  const smtp = Boolean(process.env.SMTP_HOST);
  if (!smtp && config.production) throw new Error('SMTP is not configured.');
  const transport = nodemailer.createTransport(
    smtp
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === '465',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        }
      : { streamTransport: true, newline: 'unix', buffer: true },
  );
  const result = await transport.sendMail({
    from: process.env.SMTP_FROM || 'Brightloop <billing@brightloop.local>',
    to,
    subject,
    text,
    attachments,
  });
  if (!smtp) {
    await mkdir(config.outboxDir, { recursive: true });
    await writeFile(
      path.join(config.outboxDir, `${Date.now()}-${randomUUID()}.eml`),
      result.message,
    );
    console.log(`Development email saved in ${config.outboxDir}`);
  }
  return { delivery: smtp ? 'smtp' : 'development-outbox' };
}
export function invoicePDF(inv) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' }),
      chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const money = (n) => `INR ${Number(n).toFixed(2)}`;
    doc.fontSize(25).fillColor('#2748e8').text('Brightloop');
    doc
      .moveDown()
      .fontSize(16)
      .fillColor('#17233a')
      .text(`Invoice ${inv.invoiceNumber}`);
    doc
      .fontSize(10)
      .text(
        `Status: ${inv.status} | Issued: ${inv.issueDate} | Due: ${inv.dueDate}`,
      )
      .moveDown();
    doc
      .text(`Bill to: ${inv.customerName}`)
      .text(inv.customerEmail)
      .text(inv.customerAddress || '')
      .moveDown();
    for (const l of inv.lines) {
      if (doc.y > 700) doc.addPage();
      doc
        .fontSize(11)
        .text(`${l.productName}${l.variantName ? ' / ' + l.variantName : ''}`)
        .fontSize(9)
        .text(
          `Qty ${l.quantity} x ${money(l.unitPrice)} | Discount ${money(l.discount)} | Tax ${l.taxRate}%: ${money(l.taxAmount)} | Total ${money(l.totalAmount)}`,
        )
        .moveDown();
    }
    if (doc.y > 620) doc.addPage();
    doc
      .moveDown()
      .fontSize(11)
      .text(`Subtotal: ${money(inv.subtotal)}`)
      .text(
        `Discount${inv.discountName ? ' (' + inv.discountName + ')' : ''}: ${money(inv.discountAmount)}`,
      )
      .text(`Tax: ${money(inv.taxTotal)}`)
      .text(`Total: ${money(inv.amount)}`)
      .text(`Paid: ${money(inv.paidAmount)}`)
      .text(`Balance: ${money(inv.balance)}`);
    doc.end();
  });
}
