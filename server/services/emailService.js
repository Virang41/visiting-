const nodemailer = require('nodemailer');

// ─── Gmail Transporter ────────────────────────────────────────────────────────
const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS  // Gmail App Password (not regular password)
  }
});

// ─── OTP HTML Template ────────────────────────────────────────────────────────
const otpHtml = (name, otp, purpose) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#f4f6fb;padding:24px;border-radius:16px;">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:28px;border-radius:12px;text-align:center;">
    <div style="font-size:32px;">🏢</div>
    <h1 style="margin:8px 0 0;font-size:22px;letter-spacing:1px;">VisitPass</h1>
    <p style="margin:4px 0 0;opacity:.7;font-size:13px;">Visitor Management System</p>
  </div>
  <div style="background:white;padding:32px;margin-top:16px;border-radius:12px;text-align:center;">
    <h2 style="color:#1a1a2e;margin-top:0;">🔐 Your ${purpose} OTP</h2>
    <p style="color:#555;margin-bottom:28px;">Hello <strong>${name}</strong>, aapka OTP yeh hai:</p>
    <div style="background:linear-gradient(135deg,#1a1a2e,#e94560);border-radius:14px;padding:22px 0;">
      <span style="font-size:42px;font-weight:900;color:white;letter-spacing:12px;">${otp}</span>
    </div>
    <p style="color:#e94560;font-size:13px;margin-top:20px;">⏱️ Yeh OTP sirf <strong>10 minutes</strong> ke liye valid hai.</p>
    <p style="color:#aaa;font-size:12px;">Agar aapne yeh request nahi ki toh is email ko ignore karein.</p>
  </div>
  <p style="text-align:center;color:#ccc;font-size:11px;margin-top:16px;">© VisitPass — Secure Visitor Management</p>
</div>`;

// ─── Send OTP Email ───────────────────────────────────────────────────────────
const sendOTPEmail = async (to, name, otp, purpose) => {
  const purposeLabel = purpose === 'login' ? 'Login' : 'Password Reset';
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!gmailUser || !gmailPass || gmailUser === 'your_gmail@gmail.com') {
    // No email config — just print to console
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📧  OTP for ${to}  →  ${otp}`);
    console.log(`    Purpose: ${purposeLabel} | Valid: 10 minutes`);
    console.log(`${'═'.repeat(50)}\n`);
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"VisitPass 🏢" <${gmailUser}>`,
      to,
      subject: `🔐 Your OTP for ${purposeLabel} — VisitPass`,
      html: otpHtml(name, otp, purposeLabel)
    });
    console.log(`✅ OTP email sent to ${to}`);
  } catch (err) {
    // Email failed — fall back to console so OTP is not lost
    console.error('⚠️  Email send failed:', err.message);
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📧  OTP for ${to}  →  ${otp}  (email failed, check config)`);
    console.log(`${'═'.repeat(50)}\n`);
  }
};

// ─── Generic Email (Invites, Status Updates) ──────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  if (!gmailUser || !gmailPass || gmailUser === 'your_gmail@gmail.com') {
    console.log(`📧 [Email Skipped — No Config] To: ${to}, Subject: ${subject}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"VisitPass System" <${gmailUser}>`, to, subject, html
    });
  } catch (err) {
    console.error('📧 Email failed:', err.message);
  }
};

const sendInviteEmail = async (to, visitorName, apptDetails) => {
  await sendEmail({
    to,
    subject: '📋 Visitor Appointment Confirmed — VisitPass',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:30px;border-radius:8px;text-align:center;">
          <h1 style="margin:0;font-size:24px;">🏢 VisitPass</h1>
        </div>
        <div style="background:white;padding:30px;margin-top:16px;border-radius:8px;">
          <h2 style="color:#1a1a2e;margin-top:0;">Hello, ${visitorName}!</h2>
          <p>Your visit appointment has been scheduled.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;">Host:</td><td style="font-weight:bold;">${apptDetails.host}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Date:</td><td style="font-weight:bold;">${new Date(apptDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Time:</td><td style="font-weight:bold;">${apptDetails.time}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Purpose:</td><td style="font-weight:bold;">${apptDetails.purpose}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Location:</td><td style="font-weight:bold;">${apptDetails.location}</td></tr>
          </table>
        </div>
      </div>`
  });
};

const sendStatusUpdateEmail = async (to, visitorName, status, reason) => {
  const labels = { approved: '✅ Approved', rejected: '❌ Rejected', cancelled: '🚫 Cancelled' };
  await sendEmail({
    to,
    subject: `Appointment ${labels[status] || status} — VisitPass`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#1a1a2e;color:white;padding:20px;border-radius:8px;text-align:center;"><h1>🏢 VisitPass</h1></div>
        <div style="background:white;padding:30px;border:1px solid #eee;border-radius:8px;margin-top:10px;">
          <h2>Hello, ${visitorName}!</h2>
          <p>Your appointment: <strong>${labels[status] || status}</strong></p>
          ${reason ? `<p style="color:#e74c3c;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
      </div>`
  });
};

module.exports = { sendEmail, sendOTPEmail, sendInviteEmail, sendStatusUpdateEmail };
