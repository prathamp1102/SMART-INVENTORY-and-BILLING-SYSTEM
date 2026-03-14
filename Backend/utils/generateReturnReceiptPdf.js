const PDFDocument = require("pdfkit");

const C = {
  dark:    [45,  36,  22 ],
  gold:    [196, 169, 122],
  muted:   [158, 140, 119],
  body:    [92,  78,  58 ],
  cream:   [247, 244, 239],
  border:  [240, 236, 228],
  borderDk:[232, 224, 212],
  white:   [255, 255, 255],
  green:   [22,  163, 74 ],
  amber:   [180, 83,  9  ],
  red:     [220, 38,  38 ],
  blue:    [2,   132, 199],
  purple:  [124, 58,  237],
};

const STATUS_COLOR = {
  PENDING:   C.amber,
  APPROVED:  C.green,
  COMPLETED: C.blue,
  REJECTED:  C.red,
};

const fmtMoney = (n) =>
  "Rs. " + Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  const p = new Date(d);
  return isNaN(p) ? "—" : p.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const p = new Date(d);
  return isNaN(p) ? "—" : p.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const REFUND_METHOD_LABELS = {
  CASH:         "Cash Refund",
  CARD:         "Card Refund",
  UPI:          "UPI / Bank Transfer",
  STORE_CREDIT: "Store Credit",
  OTHER:        "Other",
};

/**
 * generateReturnReceiptPdf
 * @param {Object} ret  - populated Return document
 * @returns {Promise<Buffer>}
 */
const generateReturnReceiptPdf = (ret) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: { Title: `Return Receipt ${ret.returnNo || ""}`, Subject: "Return Receipt" },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end",  () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;

      const org        = ret.branch?.organization || {};
      const orgName    = org.name      || "EVARA";
      const orgGst     = org.gstNumber || "";
      const orgAddr    = org.address   || "";
      const orgPhone   = org.phone     || "";
      const orgEmail   = org.email     || "";

      // ── 1. HEADER (dark bar) ───────────────────────────────────────────────
      const HEADER_H = 118;
      doc.rect(0, 0, W, HEADER_H).fill(C.dark);

      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.white)
         .text(orgName, 40, 26, { width: 340, lineBreak: false });

      const orgMeta = [orgAddr, [orgPhone, orgEmail].filter(Boolean).join("  ·  ")].filter(Boolean).join("\n");
      if (orgMeta) {
        doc.font("Helvetica").fontSize(8.5).fillColor([...C.white, 0.55])
           .text(orgMeta, 40, 52, { width: 340 });
      }

      // Top-right: "RETURN RECEIPT" label + returnNo
      doc.font("Helvetica").fontSize(9).fillColor([...C.white, 0.45])
         .text("RETURN RECEIPT", W - 180, 26, { width: 140, align: "right" });
      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.white)
         .text(ret.returnNo || "—", W - 180, 44, { width: 140, align: "right" });

      // Status badge
      const badgeBg = STATUS_COLOR[ret.status] || C.amber;
      const badgeW = 80, badgeH = 18, badgeX = W - 120, badgeY = 90;
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 9).fill(badgeBg);
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white)
         .text((ret.status || "PENDING").toUpperCase(), badgeX, badgeY + 5, { width: badgeW, align: "center" });

      // ── 2. META ROW ────────────────────────────────────────────────────────
      let y = HEADER_H;
      const META_H = 56, colW = W / 3;
      doc.rect(0, y, W, META_H).fill(C.white);

      const metaCols = [
        { label: "DATE",          value: fmtDateTime(ret.createdAt) },
        { label: "REFUND METHOD", value: REFUND_METHOD_LABELS[ret.refundMethod] || ret.refundMethod || "—" },
        { label: "INVOICE REF",   value: ret.invoiceNo || "—" },
      ];

      metaCols.forEach((col, i) => {
        const cx = i * colW + 22;
        if (i > 0) {
          doc.moveTo(i * colW, y + 10).lineTo(i * colW, y + META_H - 10)
             .strokeColor(C.border).lineWidth(0.5).stroke();
        }
        doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted).text(col.label, cx, y + 13, { width: colW - 30 });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text(col.value, cx, y + 26, { width: colW - 30 });
      });

      y += META_H;
      doc.moveTo(0, y).lineTo(W, y).strokeColor(C.border).lineWidth(1).stroke();

      // ── 3. CUSTOMER / RETURN INFO ──────────────────────────────────────────
      const PARTY_H = 72;
      doc.rect(0, y, W, PARTY_H).fill(C.white);

      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.gold).text("CUSTOMER", 42, y + 14, { width: W / 2 - 60 });
      doc.font("Helvetica-Bold").fontSize(14).fillColor(C.dark).text(ret.customerName || "Walk-in Customer", 42, y + 26);
      if (ret.customerPhone) {
        doc.font("Helvetica").fontSize(10).fillColor(C.body).text(ret.customerPhone, 42, y + 44);
      }
      if (ret.customerEmail) {
        const emailY = ret.customerPhone ? y + 56 : y + 44;
        doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(ret.customerEmail, 42, emailY);
      }

      doc.moveTo(W / 2, y + 10).lineTo(W / 2, y + PARTY_H - 10).strokeColor(C.border).lineWidth(0.5).stroke();

      const rx = W / 2 + 42;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.gold).text("RETURN REASON", rx, y + 14, { width: W / 2 - 60 });
      doc.font("Helvetica-Bold").fontSize(12).fillColor(C.dark).text(ret.reason || "—", rx, y + 26, { width: W / 2 - 60 });
      if (ret.restockItems !== undefined) {
        doc.font("Helvetica").fontSize(9).fillColor(C.muted)
           .text(`Restocked: ${ret.restockItems ? "Yes" : "No"}`, rx, y + 48);
      }

      y += PARTY_H;
      doc.moveTo(0, y).lineTo(W, y).strokeColor(C.border).lineWidth(1).stroke();

      // ── 4. ITEMS TABLE ─────────────────────────────────────────────────────
      const PAD = 42;
      const tW  = W - PAD * 2;
      const cols = {
        item:  { x: PAD,             w: tW * 0.48 },
        qty:   { x: PAD + tW * 0.48, w: tW * 0.10 },
        price: { x: PAD + tW * 0.58, w: tW * 0.20 },
        total: { x: PAD + tW * 0.78, w: tW * 0.22 },
      };

      y += 18;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted);
      doc.text("ITEM",       cols.item.x,  y, { width: cols.item.w });
      doc.text("QTY",        cols.qty.x,   y, { width: cols.qty.w,   align: "center" });
      doc.text("UNIT PRICE", cols.price.x, y, { width: cols.price.w, align: "right"  });
      doc.text("TOTAL",      cols.total.x, y, { width: cols.total.w, align: "right"  });

      y += 12;
      doc.moveTo(PAD, y).lineTo(W - PAD, y).strokeColor(C.dark).lineWidth(2).stroke();
      y += 8;

      (ret.items || []).forEach((item) => {
        const rowH = 22;
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.dark)
           .text(item.productName || "—", cols.item.x, y, { width: cols.item.w - 6, lineBreak: false });
        doc.font("Helvetica").fontSize(9.5).fillColor(C.body)
           .text(String(item.qty), cols.qty.x, y, { width: cols.qty.w, align: "center" });
        doc.font("Helvetica").fontSize(9.5).fillColor(C.body)
           .text(fmtMoney(item.unitPrice), cols.price.x, y, { width: cols.price.w, align: "right" });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.dark)
           .text(fmtMoney(item.total), cols.total.x, y, { width: cols.total.w, align: "right" });

        y += rowH;
        doc.moveTo(PAD, y).lineTo(W - PAD, y).strokeColor(C.border).lineWidth(0.5).stroke();
        y += 3;
      });

      // ── 5. TOTALS ──────────────────────────────────────────────────────────
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

      const subtotal = (ret.items || []).reduce((s, i) => s + (i.total || 0), 0);
      totLine("Subtotal", fmtMoney(subtotal));

      doc.moveTo(totX, y).lineTo(W - PAD, y).strokeColor(C.dark).lineWidth(2).stroke();
      y += 6;

      totLine("Total Refund", fmtMoney(ret.returnAmount), {
        boldLabel: true, boldVal: true, skipLine: true, valColor: C.green,
      });

      // ── 6. NOTES ──────────────────────────────────────────────────────────
      if (ret.notes) {
        y += 20;
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(C.muted)
           .text(`Notes: ${ret.notes}`, PAD, y, { width: tW });
      }

      // ── 7. PROCESSED BY ───────────────────────────────────────────────────
      if (ret.processedBy?.name) {
        y += 20;
        doc.font("Helvetica-Bold").fontSize(7).fillColor(C.muted)
           .text("PROCESSED BY", PAD, y);
        doc.font("Helvetica").fontSize(10).fillColor(C.dark)
           .text(ret.processedBy.name, PAD, y + 12);
      }

      // ── 8. FOOTER ─────────────────────────────────────────────────────────
      const PAGE_H   = doc.page.height;
      const FOOTER_H = 72, GST_H = 20;
      const footerTop = PAGE_H - FOOTER_H - GST_H;

      doc.moveTo(0, footerTop).lineTo(W, footerTop).strokeColor(C.borderDk).lineWidth(1).stroke();
      doc.rect(0, footerTop, W, FOOTER_H).fill(C.cream);

      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(C.muted)
         .text("Thank you for your patience. Keep this receipt for your records.", 42, footerTop + 14, { width: W * 0.52 });

      // Status stamp on footer right
      doc.roundedRect(W - 160, footerTop + 14, 120, 40, 8)
         .stroke(STATUS_COLOR[ret.status] || C.amber);
      doc.font("Helvetica-Bold").fontSize(ret.status === "COMPLETED" ? 11 : 10)
         .fillColor(STATUS_COLOR[ret.status] || C.amber)
         .text(
           ret.status === "COMPLETED" ? "✓ REFUND ISSUED" :
           ret.status === "APPROVED"  ? "✓ APPROVED" :
           ret.status === "REJECTED"  ? "✗ REJECTED" : "⏳ PENDING REVIEW",
           W - 158, footerTop + 26, { width: 116, align: "center" }
         );

      // ── 9. GST BAR ────────────────────────────────────────────────────────
      const gstTop = footerTop + FOOTER_H;
      doc.rect(0, gstTop, W, GST_H).fill(C.dark);
      doc.font("Helvetica").fontSize(7.5).fillColor([...C.white, 0.45]);
      if (orgGst) {
        doc.text(`GST No: ${orgGst}`, 42, gstTop + 6, { width: W / 2 - 42 });
      }
      doc.text("This is a computer-generated return receipt. No signature required.",
               W / 2, gstTop + 6, { width: W / 2 - 42, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generateReturnReceiptPdf };
