const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const { verifySmtp } = require("../utils/emailService");
const nodemailer = require("nodemailer");

// GET /api/email-test/smtp  — Super Admin only, tests SMTP config
router.get("/smtp", protect, authorize("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  const result = await verifySmtp();
  res.json(result);
});

// POST /api/email-test/send  — Super Admin only, sends test email
// Body: { to: "test@example.com" }
router.post("/send", protect, authorize("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Provide { to } in body" });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ ok: false, error: "SMTP_USER or SMTP_PASS not set in .env" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || "smtp.gmail.com",
      port:   parseInt(process.env.SMTP_PORT) || 587,
      requireTLS: true,
      tls: { rejectUnauthorized: false },
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from:    `"EVARA System" <${process.env.SMTP_USER}>`,
      to,
      subject: "EVARA Email Test — SMTP Working ✓",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
          <h2 style="color:#059669;margin:0 0 12px;">✅ Email is working!</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6;">
            This is a test email from your EVARA server.<br/>
            SMTP is configured correctly and emails are being delivered.
          </p>
          <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-top:20px;font-size:12px;color:#6b7280;">
            <b>SMTP Host:</b> ${process.env.SMTP_HOST}<br/>
            <b>SMTP Port:</b> ${process.env.SMTP_PORT}<br/>
            <b>From:</b> ${process.env.SMTP_USER}
          </div>
        </div>
      `,
    });
    res.json({ ok: true, messageId: info.messageId, to });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

module.exports = router;
