import { test, expect, type Page } from '@playwright/test';

const FORBIDDEN_META = /undefined|localhost|React App|Vite App|^test$|^demo$/i;

async function metaContent(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).first().getAttribute('content');
}

async function assertPublicSeo(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });

  const title = await page.title();
  expect(title.trim().length).toBeGreaterThan(3);
  expect(title).not.toMatch(FORBIDDEN_META);

  const description = await metaContent(page, 'meta[name="description"]');
  expect(description).toBeTruthy();
  expect(description!).not.toMatch(FORBIDDEN_META);

  const robots = await metaContent(page, 'meta[name="robots"]');
  expect(robots).toMatch(/index/i);

  const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
  expect(canonical).toBeTruthy();
  expect(canonical!).toMatch(/^https:\/\/slotty\.of\.by\//);

  const ogTitle = await metaContent(page, 'meta[property="og:title"]');
  const ogDescription = await metaContent(page, 'meta[property="og:description"]');
  const ogImage = await metaContent(page, 'meta[property="og:image"]');
  expect(ogTitle).toBeTruthy();
  expect(ogDescription).toBeTruthy();
  expect(ogImage).toMatch(/^https:\/\/slotty\.of\.by\/og\/.+\.jpg$/);

  expect(await page.locator('h1:visible').count()).toBe(1);
}

async function assertNoindex(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => /noindex/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''),
    null,
    { timeout: 15_000 },
  );
  const robots = await metaContent(page, 'meta[name="robots"]');
  expect(robots).toMatch(/noindex/i);
}

test.describe('SEO smoke', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL to run SEO smoke tests');

  for (const path of ['/book', '/services', '/master/start', '/services/category/manicure'] as const) {
    test(`public SEO meta: ${path}`, async ({ page }) => {
      await assertPublicSeo(page, path);
    });
  }

  test('private pages are noindex', async ({ page }) => {
    await assertNoindex(page, '/login');
    await assertNoindex(page, '/zapis?master_id=x&service_id=y');
    await assertNoindex(page, '/profile');
  });

  test('published master profile SEO when E2E_PUBLISHED_MASTER_ID is set', async ({ page }) => {
    const masterId = process.env.E2E_PUBLISHED_MASTER_ID?.trim();
    test.skip(!masterId, 'Set E2E_PUBLISHED_MASTER_ID for master profile SEO smoke');
    await assertPublicSeo(page, `/master/${encodeURIComponent(masterId!)}`);
  });
});

test.describe('Sitemap smoke', () => {
  test('sitemap index is reachable', async ({ request }) => {
    const base = process.env.E2E_BASE_URL;
    test.skip(!base, 'Set E2E_BASE_URL');
    const res = await request.get(`${base}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('sitemap-static.xml');
    expect(body).toContain('sitemap-masters.xml');
  });
});
