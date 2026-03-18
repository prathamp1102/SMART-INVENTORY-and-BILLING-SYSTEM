const Brevo = require("@getbrevo/brevo");
const { generateInvoicePdf } = require("./generateInvoicePdf");
const { generateReturnReceiptPdf } = require("./generateReturnReceiptPdf");

const getClient = () => {
  const client = new Brevo.TransactionalEmailsApi();
  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
  return client;
};

const SENDER = {
  name:  process.env.BREVO_SENDER_NAME  || "EVARA",
  email: process.env.BREVO_SENDER_EMAIL || "cherryvine.care@gmail.com",
};

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

  const email = new Brevo.SendSmtpEmail();
  email.sender  = SENDER;
  email.to      = [{ email: to }];
  email.subject = title + " — EVARA";
  email.htmlContent = html;

  await getClient().sendTransacEmail(email);
};

// ─── Invoice Email ────────────────────────────────────────────────────────────
const sendInvoiceEmail = async (to, invoice) => {
  const orgName = invoice.branch?.organization?.name || "EVARA";
  const orgGst  = invoice.branch?.organization?.gstNumber || "";

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
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 16px rgba(45,36,22,.10);">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;">GST: ${orgGst}</div>` : ""}
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;margin:0 0 8px;">Hi ${invoice.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;margin:0 0 20px;">
            Thank you for your purchase! Your invoice <strong>${invoice.invoiceNo || ""}</strong>
            dated <strong>${issueDate}</strong> for <strong>${grandTotal}</strong> is ready.
          </p>
          <div style="background:#f7f4ef;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:16px;font-weight:700;color:#2d2416;">${invoice.invoiceNo || "—"}</td>
                <td style="font-size:16px;font-weight:700;color:#2d2416;text-align:right;">${grandTotal}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9e8c77;padding-top:6px;">Payment: ${invoice.paymentMode || "—"}</td>
                <td style="font-size:12px;color:#9e8c77;text-align:right;padding-top:6px;">Status: ${invoice.status || "PAID"}</td>
              </tr>
            </table>
          </div>
          <p style="font-size:12px;color:#9e8c77;font-style:italic;margin:0;">${invoice.notes || "Thank you for your business!"}</p>
        </div>
        <div style="background:#f7f4ef;border-top:1px solid #e8e0d4;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.${orgGst ? " · GST No: " + orgGst : ""}
        </div>
      </div>
    </body></html>
  `;

  const emailObj = new Brevo.SendSmtpEmail();
  emailObj.sender  = SENDER;
  emailObj.to      = [{ email: to }];
  emailObj.subject = `Your Invoice ${invoice.invoiceNo || ""} from ${orgName}`;
  emailObj.htmlContent = html;
  emailObj.attachment = [{ content: pdfBuffer.toString("base64"), name: pdfFilename }];

  await getClient().sendTransacEmail(emailObj);
};

// ─── Return Receipt Email ─────────────────────────────────────────────────────
const sendReturnReceiptEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";

  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const STATUS_LABEL = {
    PENDING: "Pending Review", APPROVED: "Approved",
    COMPLETED: "Refund Issued", REJECTED: "Rejected",
  };
  const STATUS_COLOR = {
    PENDING: "#b45309", APPROVED: "#059669",
    COMPLETED: "#0284c7", REJECTED: "#dc2626",
  };

  const statusLabel = STATUS_LABEL[ret.status] || ret.status;
  const statusColor = STATUS_COLOR[ret.status] || "#b45309";

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          <div style="margin-top:16px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 14px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">${statusLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;">
            Your return request <strong>${ret.returnNo}</strong> has been received.
            Refund amount: <strong>${refundTotal}</strong>
          </p>
          <p style="font-size:13px;color:#5c4e3a;">Your return receipt is attached as a PDF.</p>
        </div>
        <div style="background:#f7f4ef;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.
        </div>
      </div>
    </body></html>
  `;

  const emailObj = new Brevo.SendSmtpEmail();
  emailObj.sender  = SENDER;
  emailObj.to      = [{ email: to }];
  emailObj.subject = `Return Receipt ${ret.returnNo} from ${orgName}`;
  emailObj.htmlContent = html;
  emailObj.attachment = [{ content: pdfBuffer.toString("base64"), name: pdfFilename }];

  await getClient().sendTransacEmail(emailObj);
};

// ─── Return Status Email ──────────────────────────────────────────────────────
const sendReturnStatusEmail = async (to, ret) => {
  const orgName     = ret.branch?.organization?.name || "EVARA";
  const isApproved  = ret.status === "APPROVED";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const statusColor = isApproved ? "#059669" : "#dc2626";

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          <div style="margin-top:16px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">${statusLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;">
            ${isApproved ? "✅" : "❌"} Your return request <strong>${ret.returnNo}</strong> has been
            <strong style="color:${statusColor};">${statusLabel.toLowerCase()}</strong>.
            ${isApproved ? `Refund of <strong>${refundTotal}</strong> will be processed shortly.` : "Please contact us for more information."}
          </p>
        </div>
        <div style="background:#f7f4ef;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.
        </div>
      </div>
    </body></html>
  `;

  const emailObj = new Brevo.SendSmtpEmail();
  emailObj.sender  = SENDER;
  emailObj.to      = [{ email: to }];
  emailObj.subject = `Return ${ret.returnNo} — ${statusLabel} | ${orgName}`;
  emailObj.htmlContent = html;

  await getClient().sendTransacEmail(emailObj);
};

// ─── Refund Payment Email ─────────────────────────────────────────────────────
const sendRefundPaymentEmail = async (to, ret) => {
  const orgName = ret.branch?.organization?.name || "EVARA";

  const refundTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(ret.returnAmount ?? 0);

  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;

  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:36px auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#2d2416;padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#f5f0e8;">${orgName}</div>
          <div style="margin-top:16px;display:inline-block;background:#059669;border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;font-weight:700;color:#fff;">💸 REFUND SENT</span>
          </div>
        </div>
        <div style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#2d2416;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;">
            Your refund of <strong style="color:#059669;">${refundTotal}</strong> for return
            <strong>${ret.returnNo}</strong> has been processed successfully.
          </p>
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:10px;padding:20px 24px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#059669;">${refundTotal}</div>
          </div>
        </div>
        <div style="background:#f7f4ef;padding:16px 40px;font-size:11px;color:#b0a090;text-align:center;">
          This is a computer-generated email. Please do not reply.
        </div>
      </div>
    </body></html>
  `;

  const emailObj = new Brevo.SendSmtpEmail();
  emailObj.sender  = SENDER;
  emailObj.to      = [{ email: to }];
  emailObj.subject = `Refund of ${refundTotal} Sent — ${ret.returnNo} | ${orgName}`;
  emailObj.htmlContent = html;
  emailObj.attachment = [{ content: pdfBuffer.toString("base64"), name: pdfFilename }];

  await getClient().sendTransacEmail(emailObj);
};

// ── Verify connection
const verifySmtp = async () => {
  if (!process.env.BREVO_API_KEY) {
    return { ok: false, error: "BREVO_API_KEY not set in environment" };
  }
  return { ok: true, service: "Brevo", sender: SENDER.email };
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name, password, role, orgName, branchName, branchCity }) => {
  const today        = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const locationLine = branchCity ? `${branchName}, ${branchCity}` : branchName || "—";
  const roleLabel    = role === "SUPER_ADMIN" ? "Super Administrator" : role === "ADMIN" ? "Administrator" : "Staff Member";

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px 36px;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,.75);font-size:13px;text-transform:uppercase;">EVARA</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Welcome Aboard! 🎉</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,.8);font-size:14px;">Your account is ready — let's get started.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 48px;">
            <p style="color:#888;font-size:13px;">Date: <strong style="color:#1a1a2e;">${today}</strong></p>
            <p style="color:#1a1a2e;font-size:15px;">Dear <strong>${name}</strong>,</p>
            <p style="color:#444;font-size:14px;line-height:1.8;">
              Welcome to <strong style="color:#4f46e5;">${orgName || "our organization"}</strong>. Your account has been created.
            </p>
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
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:14px;margin-bottom:16px;">
              <tr><td style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.08);">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,.45);text-transform:uppercase;">Email</p>
                <p style="margin:4px 0 0;font-size:15px;color:#a5b4fc;font-family:'Courier New',monospace;">${to}</p>
              </td></tr>
              <tr><td style="padding:18px 24px;">
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,.45);text-transform:uppercase;">Temporary Password</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#c4b5fd;font-family:'Courier New',monospace;letter-spacing:3px;">${password}</p>
              </td></tr>
            </table>
            <p style="font-size:12px;color:#f59e0b;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;">
              ⚠️ <strong>Please change your password after first login.</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f7f6ff;padding:24px 48px;text-align:center;border-top:1px solid #e8e6ff;">
            <p style="margin:0;color:#aaa;font-size:12px;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const emailObj = new Brevo.SendSmtpEmail();
  emailObj.sender  = SENDER;
  emailObj.to      = [{ email: to }];
  emailObj.subject = `Welcome to ${orgName || "EVARA"} — Your Account Details`;
  emailObj.htmlContent = html;

  await getClient().sendTransacEmail(emailObj);
};

module.exports = { sendOtpEmail, sendInvoiceEmail, sendReturnReceiptEmail, sendReturnStatusEmail, sendRefundPaymentEmail, verifySmtp, sendWelcomeEmail };