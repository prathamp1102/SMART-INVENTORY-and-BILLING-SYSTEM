const { BrevoClient, BrevoEnvironment } = require("@getbrevo/brevo");
const { generateInvoicePdf }        = require("./generateInvoicePdf");
const { generateReturnReceiptPdf }  = require("./generateReturnReceiptPdf");

const getClient = () => new BrevoClient({
  apiKey:      process.env.BREVO_API_KEY,
  environment: BrevoEnvironment.Production,
});

const SENDER = {
  name:  process.env.BREVO_SENDER_NAME  || "EVARA",
  email: process.env.BREVO_SENDER_EMAIL || "cherryvine.care@gmail.com",
};

const sendEmail = async ({ to, subject, html, attachments }) => {
  const client = getClient();
  await client.transactionalEmails.sendTransacEmail({
    sender:      SENDER,
    to:          [{ email: to }],
    subject,
    htmlContent: html,
    ...(attachments ? { attachment: attachments } : {}),
  });
};

/* ─── Shared email logo — pure text/CSS, 100% email client compatible ──── */
const LOGO_SVG = `
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
    <tr>
      <!-- Logo icon box -->
      <td style="padding-right:14px;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="border-collapse:collapse;width:44px;height:44px;background-color:#1a1a2e;border-radius:9px;">
          <tr>
            <td align="left" valign="middle" style="padding:0 0 0 8px;position:relative;">
              <!-- Stylised E using font character -->
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#ffffff;line-height:1;letter-spacing:-1px;">E</span>
            </td>
            <td align="left" valign="top" style="padding:7px 7px 0 0;width:8px;">
              <!-- Green accent dot -->
              <div style="width:7px;height:7px;border-radius:50%;background-color:#059669;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</div>
            </td>
          </tr>
        </table>
      </td>
      <!-- Wordmark -->
      <td valign="middle">
        <p style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;line-height:1;mso-line-height-rule:exactly;">EVARA</p>
        <p style="margin:4px 0 0;padding:0;font-family:'Courier New',Courier,monospace;font-size:8px;font-weight:normal;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;line-height:1;mso-line-height-rule:exactly;">SMART INVENTORY</p>
      </td>
    </tr>
  </table>`;

/* ─── Shared email footer ─────────────────────────────────────────────────── */
const EMAIL_FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:0;">
    <tr><td style="background:#f7f4ef;padding:16px 40px;text-align:center;border-top:1px solid #ede8e0;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr>
          <td style="padding-right:7px;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" border="0"
              style="width:20px;height:20px;background-color:#1a1a2e;border-radius:4px;">
              <tr><td align="center" valign="middle"
                style="font-family:'Courier New',Courier,monospace;font-size:9px;font-weight:bold;color:#ffffff;letter-spacing:0;">
                E
              </td></tr>
            </table>
          </td>
          <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:12px;font-weight:bold;color:#1a1a2e;letter-spacing:-0.3px;">EVARA</td>
        </tr>
      </table>
      <p style="margin:0;color:#b0a090;font-size:11px;font-family:Arial,sans-serif;">Smart Inventory &amp; Billing System</p>
      <p style="margin:6px 0 0;color:#c8bfb5;font-size:10px;font-family:Arial,sans-serif;">Computer-generated email — please do not reply.</p>
    </td></tr>
  </table>`;

const TITLES  = { LOGIN: "Your Login OTP", FORGOT_PASSWORD: "Your Password Reset OTP", CHANGE_PASSWORD: "Your Change Password OTP" };
const ACTIONS = { LOGIN: "complete your login", FORGOT_PASSWORD: "reset your password", CHANGE_PASSWORD: "change your password" };

/* ─── OTP Email ───────────────────────────────────────────────────────────── */
const sendOtpEmail = async (to, otp, purpose) => {
  const title  = TITLES[purpose]  || "Your OTP Code";
  const action = ACTIONS[purpose] || "proceed";

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,.1);">

        <!-- Header with logo -->
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#2d2a4a);padding:28px 36px;">
          ${LOGO_SVG}
          <p style="margin:12px 0 0;color:rgba(255,255,255,.6);font-size:12px;font-family:Arial,sans-serif;">${title}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 36px;">
          <h2 style="margin:0 0 10px;color:#1a1a2e;font-size:18px;font-weight:700;font-family:Arial,sans-serif;">Your OTP Code</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;">
            Use this code to <strong>${action}</strong>. Valid for <strong>10 minutes</strong>. Do not share it with anyone.
          </p>

          <!-- OTP box -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f5f3ee;border-radius:14px;padding:26px;text-align:center;">
              <div style="font-size:42px;font-weight:800;color:#1a1a2e;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</div>
              <p style="margin:10px 0 0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">One-Time Password · Expires in 10 min</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr><td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;">
              <p style="margin:0;font-size:12px;color:#92400e;font-family:Arial,sans-serif;">
                ⚠️ If you did not request this, please ignore this email and your account will remain safe.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({ to, subject: `${title} — EVARA`, html });
};

/* ─── Invoice Email ───────────────────────────────────────────────────────── */
const sendInvoiceEmail = async (to, invoice) => {
  const orgName     = invoice.branch?.organization?.name || "EVARA";
  const orgGst      = invoice.branch?.organization?.gstNumber || "";
  const pdfBuffer   = await generateInvoicePdf(invoice);
  const pdfFilename = `Invoice_${invoice.invoiceNo || "receipt"}.pdf`;

  const grandTotal = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(invoice.grandTotal ?? 0);

  const issueDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,.1);">

        <!-- Header -->
        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          ${LOGO_SVG}
          <div style="margin-top:14px;">
            <div style="font-size:20px;font-weight:800;color:#f5f0e8;font-family:'Georgia',serif;">${orgName}</div>
            ${orgGst ? `<div style="font-size:11px;color:rgba(245,240,232,.45);margin-top:4px;font-family:monospace;">GST: ${orgGst}</div>` : ""}
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">Hi ${invoice.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;font-family:Arial,sans-serif;">
            Thank you for your purchase! Your invoice <strong>${invoice.invoiceNo || ""}</strong> dated
            <strong>${issueDate}</strong> for <strong>${grandTotal}</strong> is attached as a PDF.
          </p>

          <!-- Invoice summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;border-radius:12px;margin:20px 0;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;border-bottom:1px solid #ede8e0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td><span style="font-size:16px;font-weight:800;color:#1a1a2e;font-family:'Georgia',serif;">${invoice.invoiceNo || "—"}</span></td>
                    <td align="right"><span style="font-size:18px;font-weight:800;color:#059669;font-family:'Georgia',serif;">${grandTotal}</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td style="padding:12px 22px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#9e8c77;font-family:Arial,sans-serif;">Payment: <strong>${invoice.paymentMode || "—"}</strong></td>
                  <td align="right" style="font-size:12px;color:#9e8c77;font-family:Arial,sans-serif;">Status: <strong style="color:#059669;">${invoice.status || "PAID"}</strong></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="font-size:12px;color:#9ca3af;font-family:Arial,sans-serif;">
            📎 Your invoice PDF is attached to this email. Please keep it for your records.
          </p>
        </td></tr>

        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to, subject: `Your Invoice ${invoice.invoiceNo || ""} from ${orgName}`, html,
    attachments: [{ content: pdfBuffer.toString("base64"), name: pdfFilename }],
  });
};

/* ─── Return Receipt Email ────────────────────────────────────────────────── */
const sendReturnReceiptEmail = async (to, ret) => {
  const orgName     = ret.branch?.organization?.name || "EVARA";
  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;
  const refundTotal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(ret.returnAmount ?? 0);

  const STATUS_LABEL = { PENDING: "Pending Review", APPROVED: "Approved", COMPLETED: "Refund Issued", REJECTED: "Rejected" };
  const STATUS_COLOR = { PENDING: "#b45309", APPROVED: "#059669", COMPLETED: "#0284c7", REJECTED: "#dc2626" };
  const statusLabel  = STATUS_LABEL[ret.status] || ret.status;
  const statusColor  = STATUS_COLOR[ret.status] || "#b45309";

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,.1);">

        <!-- Header -->
        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          ${LOGO_SVG}
          <div style="margin-top:14px;">
            <div style="font-size:20px;font-weight:800;color:#f5f0e8;font-family:'Georgia',serif;">${orgName}</div>
            <div style="margin-top:10px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 14px;">
              <span style="font-size:11px;font-weight:700;color:#fff;font-family:Arial,sans-serif;">${statusLabel.toUpperCase()}</span>
            </div>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;font-family:Arial,sans-serif;">
            Your return request <strong>${ret.returnNo}</strong> has been received and is currently
            <strong style="color:${statusColor};">${statusLabel}</strong>.
            Refund amount: <strong>${refundTotal}</strong>
          </p>
          <p style="font-size:12px;color:#9ca3af;font-family:Arial,sans-serif;">📎 Your return receipt PDF is attached to this email.</p>
        </td></tr>

        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to, subject: `Return Receipt ${ret.returnNo} from ${orgName}`, html,
    attachments: [{ content: pdfBuffer.toString("base64"), name: pdfFilename }],
  });
};

/* ─── Return Status Email ─────────────────────────────────────────────────── */
const sendReturnStatusEmail = async (to, ret) => {
  const orgName     = ret.branch?.organization?.name || "EVARA";
  const isApproved  = ret.status === "APPROVED";
  const statusLabel = isApproved ? "Approved ✅" : "Rejected ❌";
  const statusColor = isApproved ? "#059669" : "#dc2626";
  const refundTotal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(ret.returnAmount ?? 0);

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,.1);">

        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          ${LOGO_SVG}
          <div style="margin-top:14px;">
            <div style="font-size:20px;font-weight:800;color:#f5f0e8;font-family:'Georgia',serif;">${orgName}</div>
            <div style="margin-top:10px;display:inline-block;background:${statusColor};border-radius:20px;padding:4px 16px;">
              <span style="font-size:11px;font-weight:700;color:#fff;font-family:Arial,sans-serif;">RETURN ${isApproved ? "APPROVED" : "REJECTED"}</span>
            </div>
          </div>
        </td></tr>

        <tr><td style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;line-height:1.7;font-family:Arial,sans-serif;">
            Your return <strong>${ret.returnNo}</strong> has been
            <strong style="color:${statusColor};">${isApproved ? "approved" : "rejected"}</strong>.
            ${isApproved ? `A refund of <strong style="color:#059669;">${refundTotal}</strong> will be processed shortly.` : "Please contact us for more information."}
          </p>
        </td></tr>

        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({ to, subject: `Return ${ret.returnNo} — ${isApproved ? "Approved" : "Rejected"} | ${orgName}`, html });
};

/* ─── Refund Payment Email ────────────────────────────────────────────────── */
const sendRefundPaymentEmail = async (to, ret) => {
  const orgName     = ret.branch?.organization?.name || "EVARA";
  const refundTotal = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(ret.returnAmount ?? 0);
  const pdfBuffer   = await generateReturnReceiptPdf(ret);
  const pdfFilename = `Return_Receipt_${ret.returnNo || "receipt"}.pdf`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,.1);">

        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          ${LOGO_SVG}
          <div style="margin-top:14px;">
            <div style="font-size:20px;font-weight:800;color:#f5f0e8;font-family:'Georgia',serif;">${orgName}</div>
            <div style="margin-top:10px;display:inline-block;background:#059669;border-radius:20px;padding:4px 16px;">
              <span style="font-size:11px;font-weight:700;color:#fff;font-family:Arial,sans-serif;">💸 REFUND SENT</span>
            </div>
          </div>
        </td></tr>

        <tr><td style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">Hi ${ret.customerName || "Valued Customer"},</p>
          <p style="font-size:13px;color:#5c4e3a;font-family:Arial,sans-serif;">
            Your refund for return <strong>${ret.returnNo}</strong> has been processed successfully.
          </p>

          <!-- Refund amount highlight -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
            <tr><td style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:24px;text-align:center;border:1.5px solid #bbf7d0;">
              <div style="font-size:11px;color:#059669;text-transform:uppercase;letter-spacing:.1em;font-family:monospace;margin-bottom:6px;">Refund Amount</div>
              <div style="font-size:34px;font-weight:800;color:#059669;font-family:'Georgia',serif;">${refundTotal}</div>
              <div style="font-size:11px;color:#6ee7b7;margin-top:6px;font-family:Arial,sans-serif;">Return Ref: ${ret.returnNo}</div>
            </td></tr>
          </table>

          <p style="font-size:12px;color:#9ca3af;font-family:Arial,sans-serif;">📎 Updated return receipt PDF is attached.</p>
        </td></tr>

        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to, subject: `Refund of ${refundTotal} Sent — ${ret.returnNo} | ${orgName}`, html,
    attachments: [{ content: pdfBuffer.toString("base64"), name: pdfFilename }],
  });
};

/* ─── Welcome Email ───────────────────────────────────────────────────────── */
const sendWelcomeEmail = async ({ to, name, password, role, orgName, branchName, branchCity }) => {
  const today        = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const locationLine = branchCity ? `${branchName}, ${branchCity}` : branchName || "—";
  const roleLabel    = role === "SUPER_ADMIN" ? "Super Administrator" : role === "ADMIN" ? "Administrator" : "Staff Member";

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,.1);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#2d2a4a);padding:36px 48px;">
          ${LOGO_SVG}
          <h1 style="margin:16px 0 0;color:#fff;font-size:26px;font-weight:800;font-family:'Georgia',serif;">Welcome Aboard! 🎉</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.55);font-size:13px;font-family:Arial,sans-serif;">${today}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 48px;">
          <p style="color:#1a1a2e;font-size:15px;font-family:Arial,sans-serif;">Dear <strong>${name}</strong>,</p>
          <p style="color:#444;font-size:14px;line-height:1.8;font-family:Arial,sans-serif;">
            You have been added to <strong style="color:#4f46e5;">${orgName || "EVARA"}</strong> as a
            <strong>${roleLabel}</strong>. Here are your account details:
          </p>

          <!-- Assignment details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6ff;border-radius:14px;border:1.5px solid #e8e6ff;margin:20px 0;overflow:hidden;">
            <tr><td style="padding:16px 24px;border-bottom:1px solid #e8e6ff;">
              <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-family:monospace;letter-spacing:.08em;">🏢 Organization</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">${orgName || "—"}</p>
            </td></tr>
            <tr><td style="padding:16px 24px;border-bottom:1px solid #e8e6ff;">
              <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-family:monospace;letter-spacing:.08em;">📍 Branch</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">${locationLine}</p>
            </td></tr>
            <tr><td style="padding:16px 24px;">
              <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;font-family:monospace;letter-spacing:.08em;">🎭 Role</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif;">${roleLabel}</p>
            </td></tr>
          </table>

          <!-- Login credentials -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:14px;margin-bottom:16px;overflow:hidden;">
            <tr><td style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.08);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,.45);text-transform:uppercase;font-family:monospace;">Email</p>
              <p style="margin:4px 0 0;font-size:14px;color:#a5b4fc;font-family:'Courier New',monospace;">${to}</p>
            </td></tr>
            <tr><td style="padding:18px 24px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,.45);text-transform:uppercase;font-family:monospace;">Temporary Password</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#c4b5fd;font-family:'Courier New',monospace;letter-spacing:3px;">${password}</p>
            </td></tr>
          </table>

          <!-- Warning -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:12px 16px;">
              <p style="margin:0;font-size:12px;color:#92400e;font-family:Arial,sans-serif;">
                ⚠️ <strong>Please change your password after your first login for security.</strong>
              </p>
            </td></tr>
          </table>
        </td></tr>

        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({ to, subject: `Welcome to ${orgName || "EVARA"} — Your Account Details`, html });
};

/* ─── Verify connection ───────────────────────────────────────────────────── */
const verifySmtp = async () => {
  if (!process.env.BREVO_API_KEY) return { ok: false, error: "BREVO_API_KEY not set" };
  return { ok: true, service: "Brevo", sender: SENDER.email };
};

module.exports = {
  sendOtpEmail,
  sendInvoiceEmail,
  sendReturnReceiptEmail,
  sendReturnStatusEmail,
  sendRefundPaymentEmail,
  sendWelcomeEmail,
  verifySmtp,
};
