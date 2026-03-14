const PDFDocument = require("pdfkit");

const C = {
  dark:      [45,  36,  22 ],
  gold:      [196, 169, 122],
  muted:     [158, 140, 119],
  body:      [92,  78,  58 ],
  cream:     [247, 244, 239],
  border:    [240, 236, 228],
  borderDk:  [232, 224, 212],
  white:     [255, 255, 255],
  green:     [22,  163, 74 ],
  amber:     [180, 83,  9  ],
  paid:      [22,  163, 74 ],
  pending:   [202, 138, 4  ],
  cancelled: [220, 38,  38 ],
};

const fmtMoney = (n) =>
  "Rs. " + Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  const p = new Date(d);
  return isNaN(p) ? "—" : p.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const generateInvoicePdf = (invoice) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: { Title: `Invoice ${invoice.invoiceNo || ""}`, Subject: "Invoice" },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end",  () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;

      const org        = invoice.branch?.organization || {};
      const orgName    = org.name       || "EVARA";
      const orgGst     = org.gstNumber  || "";
      const orgAddr    = org.address    || "";
      const orgPhone   = org.phone      || "";
      const orgEmail   = org.email      || "";
      const branchName = invoice.branch?.branchName || "";

      // ── 1. HEADER
      const HEADER_H = 118;
      doc.rect(0, 0, W, HEADER_H).fill(C.dark);

      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.white)
         .text(orgName, 40, 26, { width: 340, lineBreak: false });

      const orgMeta = [orgAddr, [orgPhone, orgEmail].filter(Boolean).join("  ·  ")].filter(Boolean).join("\n");
      if (orgMeta) {
        doc.font("Helvetica").fontSize(8.5).fillColor([...C.white, 0.55])
           .text(orgMeta, 40, 52, { width: 340 });
      }

      const invNo = invoice.invoiceNo || invoice.invoiceNumber || "—";
      doc.font("Helvetica").fontSize(9).fillColor([...C.white, 0.45])
         .text("INVOICE", W - 170, 26, { width: 130, align: "right" });
      doc.font("Helvetica-Bold").fontSize(26).fillColor(C.white)
         .text(invNo, W - 170, 40, { width: 130, align: "right" });

      const STATUS_BG = { PAID: C.paid, PENDING: C.pending, CANCELLED: C.cancelled };
      const badgeBg   = STATUS_BG[invoice.status] || C.paid;
      const badgeW = 64, badgeH = 17, badgeX = W - 104, badgeY = 90;
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8.5).fill(badgeBg);
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white)
         .text((invoice.status || "PAID").toUpperCase(), badgeX, badgeY + 4.5, { width: badgeW, align: "center" });

      // ── 2. META ROW  (Issue Date | Due Date | Branch | Payment)
      let y = HEADER_H;
      const META_H = 56, colW = W / 3;
      doc.rect(0, y, W, META_H).fill(C.white);

      const metaCols = [
        { label: "ISSUE DATE", value: fmtDate(invoice.createdAt) },
        { label: "DUE DATE",   value: invoice.dueDate ? fmtDate(invoice.dueDate) : "—" },
        { label: "PAYMENT",    value: invoice.paymentMode || "—" },
      ];

      metaCols.forEach((col, i) => {
        const cx = i * colW + 22;
        if (i > 0) {
          doc.moveTo(i * colW, y + 10).lineTo(i * colW, y + META_H - 10)
             .strokeColor(C.border).lineWidth(0.5).stroke();
        }
        doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted).text(col.label, cx, y + 13, { width: colW - 30 });
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.dark).text(col.value, cx, y + 26, { width: colW - 30 });
      });

      y += META_H;
      doc.moveTo(0, y).lineTo(W, y).strokeColor(C.border).lineWidth(1).stroke();

      // ── 3. BILL-TO / PAYMENT INFO
      const PARTY_H = 72;
      doc.rect(0, y, W, PARTY_H).fill(C.white);

      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.gold).text("BILLED TO", 42, y + 14, { width: W / 2 - 60 });
      doc.font("Helvetica-Bold").fontSize(14).fillColor(C.dark).text(invoice.customerName || "Walk-in Customer", 42, y + 26);
      if (invoice.customerPhone) {
        doc.font("Helvetica").fontSize(10).fillColor(C.body).text(invoice.customerPhone, 42, y + 44);
      }

      doc.moveTo(W / 2, y + 10).lineTo(W / 2, y + PARTY_H - 10).strokeColor(C.border).lineWidth(0.5).stroke();

      const rx = W / 2 + 42;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.gold).text("PAYMENT INFO", rx, y + 14, { width: W / 2 - 60 });
      doc.font("Helvetica-Bold").fontSize(14).fillColor(C.dark).text(`${fmtMoney(invoice.amountPaid)} Received`, rx, y + 26);
      doc.font("Helvetica").fontSize(10).fillColor(C.body).text(`via  ${invoice.paymentMode || "—"}`, rx, y + 44);

      y += PARTY_H;
      doc.moveTo(0, y).lineTo(W, y).strokeColor(C.border).lineWidth(1).stroke();

      // ── 4. ITEMS TABLE
      const PAD = 42;
      const tW  = W - PAD * 2;
      const cols = {
        item:  { x: PAD,             w: tW * 0.38 },
        qty:   { x: PAD + tW * 0.38, w: tW * 0.09 },
        price: { x: PAD + tW * 0.47, w: tW * 0.17 },
        disc:  { x: PAD + tW * 0.64, w: tW * 0.12 },
        tax:   { x: PAD + tW * 0.76, w: tW * 0.10 },
        total: { x: PAD + tW * 0.86, w: tW * 0.14 },
      };

      y += 18;

      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted);
      doc.text("ITEM",       cols.item.x,  y, { width: cols.item.w });
      doc.text("QTY",        cols.qty.x,   y, { width: cols.qty.w,   align: "center" });
      doc.text("UNIT PRICE", cols.price.x, y, { width: cols.price.w, align: "right"  });
      doc.text("DISCOUNT",   cols.disc.x,  y, { width: cols.disc.w,  align: "right"  });
      doc.text("TAX",        cols.tax.x,   y, { width: cols.tax.w,   align: "right"  });
      doc.text("TOTAL",      cols.total.x, y, { width: cols.total.w, align: "right"  });

      y += 12;
      doc.moveTo(PAD, y).lineTo(W - PAD, y).strokeColor(C.dark).lineWidth(2).stroke();
      y += 8;

      (invoice.items || []).forEach((item) => {
        const rowH = item.barcode ? 30 : 22;

        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.dark)
           .text(item.productName || "—", cols.item.x, y, { width: cols.item.w - 6, lineBreak: false });
        if (item.barcode) {
          doc.font("Helvetica").fontSize(7.5).fillColor(C.muted)
             .text(item.barcode, cols.item.x, y + 12, { width: cols.item.w - 6 });
        }

        doc.font("Helvetica").fontSize(9.5).fillColor(C.body).text(String(item.qty), cols.qty.x, y, { width: cols.qty.w, align: "center" });
        doc.font("Helvetica").fontSize(9.5).fillColor(C.body).text(fmtMoney(item.unitPrice), cols.price.x, y, { width: cols.price.w, align: "right" });

        if (item.discount > 0) {
          doc.font("Helvetica-Bold").fontSize(8).fillColor(C.amber).text(`${item.discount}%`, cols.disc.x, y, { width: cols.disc.w, align: "right" });
        } else {
          doc.font("Helvetica").fontSize(9.5).fillColor(C.muted).text("—", cols.disc.x, y, { width: cols.disc.w, align: "right" });
        }

        if (item.taxRate > 0) {
          doc.font("Helvetica").fontSize(9.5).fillColor(C.body).text(`${item.taxRate}%`, cols.tax.x, y, { width: cols.tax.w, align: "right" });
        } else {
          doc.font("Helvetica").fontSize(9.5).fillColor(C.muted).text("—", cols.tax.x, y, { width: cols.tax.w, align: "right" });
        }

        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.dark).text(fmtMoney(item.total), cols.total.x, y, { width: cols.total.w, align: "right" });

        y += rowH;
        doc.moveTo(PAD, y).lineTo(W - PAD, y).strokeColor(C.border).lineWidth(0.5).stroke();
        y += 3;
      });

      // ── 5. TOTALS
      y += 14;
      const totW = 210, totX = W - PAD - totW;

      const totLine = (label, value, opts = {}) => {
        doc.font(opts.boldLabel ? "Helvetica-Bold" : "Helvetica")
           .fontSize(opts.boldLabel ? 13 : 10)
           .fillColor(opts.labelColor || C.body)
           .text(label, totX, y, { width: totW * 0.52 });
        doc.font(opts.boldVal ? "Helvetica-Bold" : "Helvetica")
           .fontSize(opts.boldVal ? 17 : 10)
           .fillColor(opts.valColor || C.dark)
           .text(value, totX + totW * 0.52, y, { width: totW * 0.48, align: "right" });
        y += opts.boldVal ? 22 : 18;
        if (!opts.skipLine) {
          doc.moveTo(totX, y - 2).lineTo(W - PAD, y - 2).strokeColor(C.border).lineWidth(0.5).stroke();
        }
      };

      totLine("Subtotal", fmtMoney(invoice.subtotal));
      if (invoice.discountAmount > 0) totLine("Discount", `- ${fmtMoney(invoice.discountAmount)}`, { valColor: C.amber });
      if (invoice.taxAmount > 0)     totLine("Tax (GST)", `+ ${fmtMoney(invoice.taxAmount)}`);

      doc.moveTo(totX, y).lineTo(W - PAD, y).strokeColor(C.dark).lineWidth(2).stroke();
      y += 6;

      totLine("Grand Total", fmtMoney(invoice.grandTotal), { boldLabel: true, boldVal: true, skipLine: true });
      if (invoice.change > 0) totLine("Change Returned", fmtMoney(invoice.change), { valColor: C.green, skipLine: true });

      // ── 6. FOOTER
      const PAGE_H = doc.page.height;
      const FOOTER_H = 72, GST_H = 20;
      const footerTop = PAGE_H - FOOTER_H - GST_H;
      if (y > footerTop - 16) y = footerTop - 16;

      doc.moveTo(0, footerTop).lineTo(W, footerTop).strokeColor(C.borderDk).lineWidth(1).stroke();
      doc.rect(0, footerTop, W, FOOTER_H).fill(C.cream);

      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(C.muted)
         .text(invoice.notes || "Thank you for your business!", 42, footerTop + 14, { width: W * 0.52 });

      if (invoice.cashier?.name) {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted)
           .text("SERVED BY", W - 185, footerTop + 14, { width: 143, align: "right" });
        doc.font("Helvetica-Bold").fontSize(11).fillColor(C.dark)
           .text(invoice.cashier.name, W - 185, footerTop + 26, { width: 143, align: "right" });
        if (invoice.cashier.email) {
          doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
             .text(invoice.cashier.email, W - 185, footerTop + 42, { width: 143, align: "right" });
        }
      }

      // ── 7. GST BAR
      const gstTop = footerTop + FOOTER_H;
      doc.rect(0, gstTop, W, GST_H).fill(C.dark);
      doc.font("Helvetica").fontSize(7.5).fillColor([...C.white, 0.45]);
      if (orgGst) {
        doc.text(`GST No: ${orgGst}`, 42, gstTop + 6, { width: W / 2 - 42 });
      }
      doc.text("This is a computer-generated invoice. No signature required.",
               W / 2, gstTop + 6, { width: W / 2 - 42, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generateInvoicePdf };
