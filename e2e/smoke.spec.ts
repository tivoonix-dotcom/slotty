import { test, expect } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL?.replace(/\/$/, '');

test.describe('Public smoke', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL to run UI smoke tests');

  test('hub loads', async ({ page }) => {
    await page.goto('/hub');
    await expect(page.locator('body')).toBeVisible();
  });

  test('services catalog loads', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('body')).toBeVisible();
  });

  test('legacy masters url redirects to services', async ({ page }) => {
    await page.goto('/masters');
    await expect(page).toHaveURL(/\/services/);
  });
});

test.describe('API smoke', () => {
  test.skip(!apiUrl, 'Set E2E_API_URL for API smoke');

  test('health and ready', async ({ request }) => {
    const health = await request.get(`${apiUrl}/api/health/`);
    expect(health.ok()).toBeTruthy();

    const ready = await request.get(`${apiUrl}/api/health/ready`);
    expect(ready.status()).toBe(200);
    const body = await ready.json();
    expect(body.status).toBe('ok');
  });

  test('catalog listings', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/catalog/listings?limit=5`);
    expect(res.ok()).toBeTruthy();
  });
});
