import { readFileSync } from 'fs';
import { join } from 'path';

const PAGE_MAP = {
  '/':             'index.html',
  '/asc-mail':     'asc-mail.html',
  '/weekly-report':'weekly-report.html',
};

export default function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');

  if (cookies.rv_session !== 'authenticated') {
    res.setHeader('Location', '/login');
    return res.status(302).end();
  }

  const file = PAGE_MAP[req.url] || 'index.html';

  try {
    const html = readFileSync(join(process.cwd(), 'public', file), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send('Could not load page.');
  }
}

function parseCookies(header) {
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]) => k)
  );
}