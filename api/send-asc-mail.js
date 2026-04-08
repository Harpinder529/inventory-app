import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // ── Auth gate — must have a valid session cookie ──────────────────────────
  const cookie = req.headers.cookie || '';
  if (!cookie.includes('rv_session=authenticated')) {
    return res.status(401).json({ error: 'Unauthorised — please log in' });
  }

  // ── Method guard ──────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse & validate payload ──────────────────────────────────────────────
  const { smtp, to, cc = [], subject, body, attachName, attachBase64 } = req.body || {};

  if (!smtp?.host || !smtp?.user || !smtp?.pass || !smtp?.fromEmail) {
    return res.status(400).json({ error: 'Missing SMTP configuration' });
  }
  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Invalid or missing To address' });
  }
  if (!subject || !body) {
    return res.status(400).json({ error: 'Missing subject or body' });
  }
  if (!attachBase64 || !attachName) {
    return res.status(400).json({ error: 'Missing attachment data' });
  }

  // ── Build Nodemailer transport ────────────────────────────────────────────
  const isSSL = smtp.security === 'ssl';
  const isTLS = smtp.security === 'tls';

  const transportConfig = {
    host: smtp.host,
    port: smtp.port || (isSSL ? 465 : 587),
    secure: isSSL,           // true = SSL/TLS on connect (port 465)
    auth: {
      user: smtp.user,
      pass: smtp.pass
    },
    ...(isTLS && {
      requireTLS: true,
      tls: { rejectUnauthorized: false }
    }),
    // Allow self-signed certs on private mail servers
    tls: { rejectUnauthorized: false }
  };

  const transporter = nodemailer.createTransport(transportConfig);

  // ── Build mail options ────────────────────────────────────────────────────
  // Filter & deduplicate CC list
  const ccList = [...new Set(
    (Array.isArray(cc) ? cc : [cc])
      .map(e => String(e||'').trim())
      .filter(e => e && e.includes('@') && e !== to)
  )];

  const mailOptions = {
    from: `"${smtp.fromName || 'Central Warehouse Team'}" <${smtp.fromEmail}>`,
    to,
    ...(ccList.length && { cc: ccList }),
    subject,
    text: body,
    attachments: [
      {
        filename: attachName,
        content:  attachBase64,
        encoding: 'base64',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ]
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[send-asc-mail] Sent to ${to} — messageId: ${info.messageId}`);
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('[send-asc-mail] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to send mail' });
  }
}
