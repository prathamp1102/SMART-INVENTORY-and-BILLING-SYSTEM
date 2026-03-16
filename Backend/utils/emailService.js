const nodemailer = require("nodemailer");
const { generateInvoicePdf } = require("./generateInvoicePdf");
const { generateReturnReceiptPdf } = require("./generateReturnReceiptPdf");

// ── Create transporter lazily so missing env vars are caught at send-time, not startup
const getTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_PORT === "465"), // true only for port 465
    requireTLS: true,
    family: 4, // ✅ Force IPv4 — Render free tier blocks IPv6
    tls: {
      rejectUnauthorized: false, // allow self-signed certs in dev
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: true,
    debug:  true,
  });

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

  await getTransporter().sendMail({
    from:    '"EVARA" <' + process.env.SMTP_USER + '>',
    to,
    subject: title + " — EVARA",
    html,
  });
};

// ─── Invoice Email (with PDF attachment) ──────────────────────────────────────
const sendInvoiceEmail = async (to, invoice) => {
  const orgName = invoice.branch?.organization?.name || "EVARA";
  const orgGst  = invoice.branch?.organization?.gstNumber || "";

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env to send invoice emails.");
  }

  const pdfBuffer = await generateInvoicePdf(invoice);
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
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 24px;">Please find your invoice attached as a PDF.</p>
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
            </table>
          </div>
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from:    `"${orgName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Invoice ${invoice.invoiceNo || ""} from ${orgName}`,
    html,
    attachments: [{ filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" }],
  });
};

// ─── Return Receipt Email ─────────────────────────────────────────────────────
const sendReturnReceiptEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env to send return receipt emails.");
  }
  const pdfBuffer  = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;
  const transporter = getTransporter();
  await transporter.sendMail({
    from:    `"${orgName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Return Receipt ${ret.returnNo} from ${orgName}`,
    html: `<p>Your return receipt is attached.</p>`,
    attachments: [{ filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" }],
  });
};

// ─── Return Status Email ──────────────────────────────────────────────────────
const sendReturnStatusEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env to send emails.");
  }
  const statusLabel = ret.status === "APPROVED" ? "Approved" : "Rejected";
  await getTransporter().sendMail({
    from:    `"${orgName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Return ${ret.returnNo} — ${statusLabel} | ${orgName}`,
    html: `<p>Your return request <strong>${ret.returnNo}</strong> has been <strong>${statusLabel.toLowerCase()}</strong>.</p>`,
  });
};

// ─── Refund Payment Sent Email ────────────────────────────────────────────────
const sendRefundPaymentEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env to send emails.");
  }
  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;
  const refundTotal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(ret.returnAmount ?? 0);
  await getTransporter().sendMail({
    from:    `"${orgName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Refund of ${refundTotal} Sent — ${ret.returnNo} | ${orgName}`,
    html: `<p>Your refund of <strong>${refundTotal}</strong> has been processed.</p>`,
    attachments: [{ filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" }],
  });
};

// ── Utility: verify SMTP connection
const verifySmtp = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { ok: false, error: "SMTP_USER or SMTP_PASS not set in .env" };
  }
  try {
    await getTransporter().verify();
    return { ok: true, user: process.env.SMTP_USER };
  } catch (err) {
    return { ok: false, error: err.message, code: err.code };
  }
};

const sendWelcomeEmail = async ({ to, name, password, role, orgName, branchName, branchCity }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env to send welcome emails.");
  }
  const roleLabel = role === "SUPER_ADMIN" ? "Super Administrator" : role === "ADMIN" ? "Administrator" : "Staff Member";
  const locationLine = branchCity ? `${branchName}, ${branchCity}` : branchName || "—";
  await getTransporter().sendMail({
    from:    `"EVARA" <${process.env.SMTP_USER}>`,
    to,
    subject: `Welcome to ${orgName || "EVARA"} — Your Account Details`,
    html: `
      <p>Dear <strong>${name}</strong>,</p>
      <p>Welcome to <strong>${orgName || "EVARA"}</strong>!</p>
      <p><strong>Role:</strong> ${roleLabel}</p>
      <p><strong>Branch:</strong> ${locationLine}</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please change your password after first login.</p>
    `,
  });
};

module.exports = { sendOtpEmail, sendInvoiceEmail, sendReturnReceiptEmail, sendReturnStatusEmail, sendRefundPaymentEmail, verifySmtp, sendWelcomeEmail };