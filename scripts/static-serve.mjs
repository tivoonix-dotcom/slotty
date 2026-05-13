/**
 * Статическая отдача `dist/` для Railway / любого хоста с переменной PORT (SPA fallback).
 * Без зависимостей — только Node.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'dist');
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
};

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0] ?? '/');
  const rel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(base, rel);
  if (!full.startsWith(base)) return null;
  return full;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  const pathname = new URL(req.url, 'http://local').pathname;
  if (pathname.startsWith('/api')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const resolved = safeJoin(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!resolved) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.stat(resolved, (err, st) => {
    if (!err && st.isFile()) {
      sendFile(res, resolved);
      return;
    }

    const indexHtml = path.join(root, 'index.html');
    fs.stat(indexHtml, (e2, st2) => {
      if (e2 || !st2.isFile()) {
        res.writeHead(503);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('dist/index.html missing — run npm run build first');
        return;
      }
      sendFile(res, indexHtml);
    });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`static-serve: dist from ${root} on 0.0.0.0:${port}`);
});
