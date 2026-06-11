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

const indexPath = path.join(root, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[static-serve] FATAL: dist not found. Expected:', indexPath);
  console.error('[static-serve] cwd:', process.cwd());
  process.exit(1);
}

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

function cacheControlFor(ext) {
  if (['.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }
  if (ext === '.html') return 'no-store, no-cache, must-revalidate, max-age=0';
  if (ext === '.xml') return 'public, max-age=3600';
  if (['.js', '.css', '.mjs'].includes(ext)) return 'public, max-age=31536000, immutable';
  return 'public, max-age=3600';
}

const SITEMAP_API_BASE = (process.env.SITEMAP_API_BASE || process.env.VITE_API_URL || '')
  .trim()
  .replace(/\/$/, '');

/** Публичные страницы с post-build prerender (dist/prerender/*.html). */
const PRERENDER_ROUTES = {
  '/book': 'prerender/book.html',
  '/services': 'prerender/services.html',
  '/master/start': 'prerender/master-start.html',
  '/services/category/manicure': 'prerender/services-category-manicure.html',
  '/services/category/barbers': 'prerender/services-category-barbers.html',
  '/services/category/brows-lashes': 'prerender/services-category-brows-lashes.html',
  '/services/category/massage': 'prerender/services-category-massage.html',
  '/services/category/fitness': 'prerender/services-category-fitness.html',
  '/services/category/tattoo': 'prerender/services-category-tattoo.html',
};

function sitemapUnavailableXml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${message} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`;
}

async function proxySitemapMasters(res) {
  if (!SITEMAP_API_BASE) {
    res.writeHead(503, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(
      sitemapUnavailableXml(
        'SITEMAP_API_BASE is not configured on slotty-web. Set it to the public API origin.',
      ),
    );
    return;
  }
  try {
    const upstream = await fetch(`${SITEMAP_API_BASE}/api/public/sitemap-masters.xml`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      res.writeHead(502, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(sitemapUnavailableXml('Upstream sitemap-masters request failed.'));
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(body);
  } catch (err) {
    console.error('[static-serve] sitemap-masters proxy failed:', err instanceof Error ? err.message : err);
    res.writeHead(502, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(sitemapUnavailableXml('sitemap-masters proxy error'));
  }
}

function tryPrerenderFile(pathname) {
  const rel = PRERENDER_ROUTES[pathname];
  if (!rel) return null;
  const full = path.join(root, rel);
  return fs.existsSync(full) ? full : null;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', cacheControlFor(ext));
  if (ext === '.html') {
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('[static-serve] read error', filePath, err.message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('file read error');
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  const pathname = new URL(req.url, 'http://local').pathname;

  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  if (req.method === 'GET' && pathname === '/sitemap-masters.xml') {
    void proxySitemapMasters(res);
    return;
  }

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

  const prerenderPath = tryPrerenderFile(pathname);
  if (prerenderPath) {
    sendFile(res, prerenderPath);
    return;
  }

  fs.stat(resolved, (err, st) => {
    if (!err && st.isFile()) {
      sendFile(res, resolved);
      return;
    }

    fs.stat(indexPath, (e2, st2) => {
      if (e2 || !st2.isFile()) {
        res.writeHead(503);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('dist/index.html missing — run npm run build first');
        return;
      }
      sendFile(res, indexPath);
    });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[static-serve] dist=${root} listen=0.0.0.0:${port} cwd=${process.cwd()}`);
  if (!SITEMAP_API_BASE) {
    console.warn(
      '[static-serve] SITEMAP_API_BASE is not set — /sitemap-masters.xml will return 503 until configured',
    );
  }
});
