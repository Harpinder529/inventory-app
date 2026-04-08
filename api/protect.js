import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');

  if (cookies.rv_session !== 'authenticated') {
    res.setHeader('Location', '/login.html');
    return res.status(302).end();
  }

  try {
    const filePath = join(process.cwd(), 'public', 'index.html');
    const html = readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send('Could not load app.');
  }
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]) => k)
  );
}
