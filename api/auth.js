export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  const validUser = process.env.APP_USERNAME;
  const validPass = process.env.APP_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  if (username === validUser && password === validPass) {
    // Secure session cookie — 8 hours
    res.setHeader(
      'Set-Cookie',
      `rv_session=authenticated; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
