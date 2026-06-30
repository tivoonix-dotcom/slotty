/**
 * Post-build prerender публичных страниц (meta в HTML для краулеров без JS).
 * Запуск: node scripts/prerender-public-pages.mjs
 * Пропуск: SKIP_PRERENDER=1
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = path.join(DIST, 'prerender');

const ROUTES = [
  '/book',
  '/services',
  '/master/start',
  '/services/category/manicure',
  '/services/category/barbers',
  '/services/category/brows-lashes',
  '/services/category/massage',
  '/services/category/fitness',
  '/services/category/tattoo',
];

function routeToFile(route) {
  if (route === '/book') return 'book.html';
  if (route === '/services') return 'services.html';
  if (route === '/master/start') return 'master-start.html';
  const match = route.match(/^\/services\/category\/(.+)$/);
  if (match) return `services-category-${match[1]}.html`;
  return null;
}

function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          resolve(undefined);
          return;
        }
      } catch {
        /* retry */
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`static server not ready: ${url}`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function main() {
  if (
    process.env.SKIP_PRERENDER === '1' ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.CI === 'true'
  ) {
    console.log('[prerender] skipped (SKIP_PRERENDER / Railway / CI)');
    return;
  }

  const port = Number.parseInt(process.env.PRERENDER_PORT ?? '4173', 10);
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/static-serve.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  child.stdout?.on('data', (chunk) => {
    serverLog += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    serverLog += String(chunk);
  });

  try {
    await waitForServer(`${baseUrl}/health`);
    await mkdir(OUT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const route of ROUTES) {
      const outName = routeToFile(route);
      if (!outName) continue;
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForFunction(() => document.title && document.title.length > 2, null, {
        timeout: 20_000,
      });
      const html = await page.content();
      await writeFile(path.join(OUT_DIR, outName), html, 'utf8');
      console.log(`[prerender] ${route} → prerender/${outName}`);
    }

    await browser.close();
    console.log(`[prerender] done (${ROUTES.length} routes)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[prerender] failed:', message);
    if (serverLog.trim()) console.error(serverLog.trim());
    if (/Executable doesn't exist|playwright install/i.test(message)) {
      console.error('[prerender] hint: run `npx playwright install chromium` or set SKIP_PRERENDER=1');
    }
    if (process.env.PRERENDER_REQUIRED === '1') {
      process.exitCode = 1;
    } else {
      console.warn('[prerender] continuing without prerender HTML (set PRERENDER_REQUIRED=1 to fail build)');
    }
  } finally {
    child.kill('SIGTERM');
  }
}

main();
