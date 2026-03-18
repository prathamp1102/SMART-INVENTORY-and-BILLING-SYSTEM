const { Resend } = require("resend");
const { generateInvoicePdf } = require("./generateInvoicePdf");
const { generateReturnReceiptPdf } = require("./generateReturnReceiptPdf");

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const FROM = "EVARA <onboarding@resend.dev>";

const TITLES = {
  LOGIN:           "Your Login OTP",
  FORGOT_PASSWORD: "Your Password Reset OTP",
  CHANGE_PASSWORD: "Your Change Password OTP",
};

const ACTIONS = {
  LOGIN:           "complete your login",
  FORGOT_PASSWORD: "reset your password",
  CHANGE_PASSWORD: "change your password",
};

// ─── OTP Email ────────────────────────────────────────────────────────────────
const sendOtpEmail = async (to, otp, purpose) => {
  const title  = TITLES[purpose]  || "Your OTP Code";
  const action = ACTIONS[purpose] || "proceed";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-.02em;">EVARA</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:12px;">${title}</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:17px;font-weight:700;">Your OTP Code</h2>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
          Use this code to ${action}. Valid for <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
        <div style="background:#f5f3ee;border-radius:12px;padding:24px;text-align:center;font-size:38px;font-weight:800;color:#4f46e5;letter-spacing:12px;font-family:monospace;">
          ${otp}
        </div>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: title + " — EVARA",
    html,
  });
};

// ─── Invoice Email (with PDF attachment) ──────────────────────────────────────
const sendInvoiceEmail = async (to, invoice) => {
  const orgName = invoice.branch?.organization?.name || "EVARA";
  const orgGst  = invoice.branch?.organization?.gstNumber || "";

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY must be set in environment to send invoice emails.");
  }

  const pdfBuffer   = await generateInvoicePdf(invoice);
  const pdfFilename = `Invoice_${invoice.invoiceNo || "receipt"}.pdf`;

  const grandTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(invoice.grandTotal ?? 0);

  const issueDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 16px rgba(45,36,22,.10);">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;letter-spacing:-.3px;">${orgName}</div>
          ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;">GST: ${orgGst}</div>` : ""}
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;margin:0 0 8px;">Hi ${invoice.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 20px;">
            Thank you for your purchase! Your invoice <strong>${invoice.invoiceNo || ""}</strong>
            dated <strong>${issueDate}</strong> for <strong>${grandTotal}</strong> is ready.
          </p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 24px;">
            Please find your invoice attached as a PDF. You can save or print it for your records.
          </p>
          <div style="background:#f7f4ef;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9e8c77;padding-bottom:10px;">Invoice No</td>
                <td style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9e8c77;text-align:right;padding-bottom:10px;">Amount</td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:700;color:#2d2416;">${invoice.invoiceNo || "—"}</td>
                <td style="font-size:16px;font-weight:700;color:#2d2416;text-align:right;">${grandTotal}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9e8c77;padding-top:6px;">Payment: ${invoice.paymentMode || "—"}</td>
                <td style="font-size:12px;color:#9e8c77;text-align:right;padding-top:6px;">Status:
                  <span style="font-weight:700;color:${invoice.status === "PAID" ? "#16a34a" : invoice.status === "PENDING" ? "#ca8a04" : "#dc2626"};">
                    ${invoice.status || "PAID"}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <p style="font-size:12px;color:#9e8c77;font-style:italic;margin:0;">${invoice.notes || "Thank you for your business!"}</p>
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply to this email.
          ${orgGst ? " · GST No: " + orgGst : ""}
        </div>
      </div>
    </body>
    </html>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Your Invoice ${invoice.invoiceNo || ""} from ${orgName}`,
    html,
    attachments: [
      { filename: pdfFilename, content: pdfBuffer },
    ],
  });
};

// ─── Return Receipt Email (with PDF attachment) ───────────────────────────────
const sendReturnReceiptEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  const orgGst  = ret.branch?.organization?.gstNumber || "";

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY must be set in environment.");
  }

  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const returnDate = ret.createdAt
    ? new Date(ret.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "";

  const STATUS_COLOR_HEX = {
    PENDING:   "#b45309",
    APPROVED:  "#059669",
    COMPLETED: "#0284c7",
    REJECTED:  "#dc2626",
  };
  const STATUS_LABEL = {
    PENDING:   "Pending Review",
    APPROVED:  "Approved",
    COMPLETED: "Refund Issued",
    REJECTED:  "Rejected",
  };

  const statusColor = STATUS_COLOR_HEX[ret.status] || "#b45309";
  const statusLabel = STATUS_LABEL[ret.status]      || ret.status;

  const REFUND_METHOD_LABELS = {
    CASH: "Cash Refund", CARD: "Card Refund",
    UPI: "UPI / Bank Transfer", STORE_CREDIT: "Store Credit", OTHER: "Other",
  };

  const itemRows = (ret.items || []).map(item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#2d2416;border-bottom:1px solid #f0ece4;">${item.productName}</td>
      <td style="padding:8px 0;font-size:13px;color:#5c4e3a;text-align:center;border-bottom:1px solid #f0ece4;">${item.qty}</td>
      <td style="padding:8px 0;font-size:13px;color:#5c4e3a;text-align:right;border-bottom:1px solid #f0ece4;">
        ₹${Number(item.unitPrice ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </td>
      <td style="padding:8px 0;font-size:13px;font-weight:700;color:#2d2416;text-align:right;border-bottom:1px solid #f0ece4;">
        ₹${Number(item.total ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:580px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(45,36,22,.10);">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;">GST: ${orgGst}</div>` : ""}
          <div style="margin-top:16px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 14px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">${statusLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;margin:0 0 6px;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 24px;">
            Your return request <strong>${ret.returnNo}</strong> dated <strong>${returnDate}</strong>
            has been received and is currently <strong style="color:${statusColor};">${statusLabel}</strong>.
          </p>
          <div style="background:#f7f4ef;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="font-size:18px;font-weight:700;color:#2d2416;">${ret.returnNo}</td>
                <td style="font-size:18px;font-weight:700;color:#059669;text-align:right;">${refundTotal}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9e8c77;padding-top:6px;">${ret.invoiceNo ? `Invoice: ${ret.invoiceNo}` : "No invoice reference"}</td>
                <td style="font-size:12px;color:#9e8c77;text-align:right;padding-top:6px;">Via: ${REFUND_METHOD_LABELS[ret.refundMethod] || ret.refundMethod || "—"}</td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9e8c77;text-align:left;padding-bottom:6px;">Item</th>
                <th style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9e8c77;text-align:center;padding-bottom:6px;">Qty</th>
                <th style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9e8c77;text-align:right;padding-bottom:6px;">Unit Price</th>
                <th style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9e8c77;text-align:right;padding-bottom:6px;">Total</th>
              </tr>
              ${itemRows}
              <tr>
                <td colspan="3" style="padding-top:10px;font-size:13px;font-weight:700;color:#2d2416;">Total Refund</td>
                <td style="padding-top:10px;font-size:15px;font-weight:800;color:#059669;text-align:right;">${refundTotal}</td>
              </tr>
            </table>
          </div>
          ${ret.reason ? `<div style="background:#fef9f0;border-left:3px solid #b45309;border-radius:4px;padding:12px 16px;margin-bottom:20px;"><div style="font-size:11px;font-weight:700;color:#b45309;margin-bottom:4px;">RETURN REASON</div><div style="font-size:13px;color:#5c4e3a;">${ret.reason}</div></div>` : ""}
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.${orgGst ? " · GST No: " + orgGst : ""}
        </div>
      </div>
    </body></html>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Return Receipt ${ret.returnNo} from ${orgName}`,
    html,
    attachments: [{ filename: pdfFilename, content: pdfBuffer }],
  });
};

// ─── Return Status Email ──────────────────────────────────────────────────────
const sendReturnStatusEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  const orgGst  = ret.branch?.organization?.gstNumber || "";

  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY must be set.");

  const isApproved  = ret.status === "APPROVED";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const statusColor = isApproved ? "#059669" : "#dc2626";
  const statusIcon  = isApproved ? "✅" : "❌";

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const REFUND_METHOD_LABELS = {
    CASH: "Cash Refund", CARD: "Card Refund",
    UPI: "UPI / Bank Transfer", STORE_CREDIT: "Store Credit", OTHER: "Other",
  };

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(45,36,22,.10);">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;">GST: ${orgGst}</div>` : ""}
          <div style="margin-top:16px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">${statusLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;margin:0 0 8px;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 24px;">
            ${statusIcon} Your return request <strong>${ret.returnNo}</strong> has been
            <strong style="color:${statusColor};">${statusLabel.toLowerCase()}</strong> by our team.
          </p>
          <div style="background:#f7f4ef;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:16px;font-weight:700;color:#2d2416;">${ret.returnNo}</td>
                <td style="font-size:16px;font-weight:700;color:${isApproved ? "#059669" : "#9e8c77"};text-align:right;">${isApproved ? refundTotal : "—"}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9e8c77;padding-top:6px;">Reason: ${ret.reason || "—"}</td>
                <td style="font-size:12px;color:#9e8c77;text-align:right;padding-top:6px;">${isApproved ? `Via: ${REFUND_METHOD_LABELS[ret.refundMethod] || "—"}` : ""}</td>
              </tr>
            </table>
          </div>
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.${orgGst ? " · GST No: " + orgGst : ""}
        </div>
      </div>
    </body></html>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Return ${ret.returnNo} — ${statusLabel} | ${orgName}`,
    html,
  });
};

// ─── Refund Payment Sent Email ────────────────────────────────────────────────
const sendRefundPaymentEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  const orgGst  = ret.branch?.organization?.gstNumber || "";

  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY must be set.");

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const REFUND_METHOD_LABELS = {
    CASH: "Cash Refund", CARD: "Card Refund",
    UPI: "UPI / Bank Transfer", STORE_CREDIT: "Store Credit", OTHER: "Other",
  };

  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(45,36,22,.10);">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;">GST: ${orgGst}</div>` : ""}
          <div style="margin-top:16px;display:inline-block;background:#059669;border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">💸 REFUND SENT</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;margin:0 0 8px;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 24px;">
            Your refund of <strong style="color:#059669;">${refundTotal}</strong> for return
            <strong>${ret.returnNo}</strong> has been processed successfully.
          </p>
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#059669;margin-bottom:6px;">Refund Amount</div>
            <div style="font-size:30px;font-weight:800;color:#059669;">${refundTotal}</div>
            <div style="font-size:13px;color:#16a34a;margin-top:6px;">${REFUND_METHOD_LABELS[ret.refundMethod] || ret.refundMethod}</div>
          </div>
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.${orgGst ? " · GST No: " + orgGst : ""}
        </div>
      </div>
    </body></html>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Refund of ${refundTotal} Sent — ${ret.returnNo} | ${orgName}`,
    html,
    attachments: [{ filename: pdfFilename, content: pdfBuffer }],
  });
};

// ── Utility: verify Resend connection
const verifySmtp = async () => {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not set in environment" };
  }
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      process.env.SMTP_USER || "test@example.com",
      subject: "EVARA SMTP Verify Test",
      html:    "<p>SMTP verification test</p>",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name, password, role, orgName, branchName, branchCity }) => {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY must be set.");

  const today        = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const locationLine = branchCity ? `${branchName}, ${branchCity}` : branchName || "—";
  const roleLabel    = role === "SUPER_ADMIN" ? "Super Administrator" : role === "ADMIN" ? "Administrator" : "Staff Member";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px 36px;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,.75);font-size:13px;letter-spacing:.08em;text-transform:uppercase;">EVARA</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Welcome Aboard! 🎉</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,.8);font-size:14px;">Your account is ready — let's get started.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 48px;">
            <p style="color:#888;font-size:13px;">Date: <strong style="color:#1a1a2e;">${today}</strong></p>
            <p style="margin:20px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">Dear <strong>${name}</strong>,</p>
            <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.8;">
              We are pleased to welcome you to <strong style="color:#4f46e5;">${orgName || "our organization"}</strong>.
              Your account has been created and you are now an official member of our team.
            </p>
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#4f46e5;letter-spacing:.07em;text-transform:uppercase;">Your Assignment</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6ff;border-radius:14px;border:1.5px solid #e8e6ff;margin-bottom:24px;">
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e8e6ff;">
                <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">🏢 Organization</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">${orgName || "—"}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e8e6ff;">
                <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">📍 Branch</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">${locationLine}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;">
                <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">🎭 Role</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">${roleLabel}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#4f46e5;letter-spacing:.07em;text-transform:uppercase;">Login Credentials</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:14px;margin-bottom:16px;">
              <tr><td style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.08);">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,.45);text-transform:uppercase;">Email Address</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#a5b4fc;font-family:'Courier New',monospace;">${to}</p>
              </td></tr>
              <tr><td style="padding:18px 24px;">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,.45);text-transform:uppercase;">Temporary Password</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#c4b5fd;font-family:'Courier New',monospace;letter-spacing:3px;">${password}</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#f59e0b;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;">
              ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f7f6ff;padding:24px 48px;text-align:center;border-top:1px solid #e8e6ff;">
            <p style="margin:0 0 6px;color:#1a1a2e;font-size:13px;font-weight:600;">EVARA System</p>
            <p style="margin:0;color:#aaa;font-size:12px;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Welcome to ${orgName || "EVARA"} — Your Account Details`,
    html,
  });
};

module.exports = { sendOtpEmail, sendInvoiceEmail, sendReturnReceiptEmail, sendReturnStatusEmail, sendRefundPaymentEmail, verifySmtp, sendWelcomeEmail };