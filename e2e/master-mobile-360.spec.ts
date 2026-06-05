import { test, expect } from '@playwright/test';
import {
  assertNoHorizontalScroll,
  cleanupDay1Master,
  injectMasterAuth,
  seedDay1Master,
  waitForMasterCabinet,
  type Day1Seed,
} from './helpers/seedDay1Master';
import { createServiceViaUi, openMonthWizard, runMonthWizard } from './helpers/masterMonthWizard';

const apiUrl = process.env.E2E_API_URL?.replace(/\/$/, '');
const uiEnabled = Boolean(process.env.E2E_BASE_URL && process.env.E2E_UI_DAY1 === '1');

test.use({ viewport: { width: 360, height: 800 } });

test.describe('Master mobile 360px smoke', () => {
  test.skip(!uiEnabled, 'Set E2E_BASE_URL and E2E_UI_DAY1=1');

  let seed: Day1Seed;

  test.beforeAll(async () => {
    test.skip(!apiUrl, 'Set E2E_API_URL');
    const ready = await fetch(`${apiUrl}/api/health/ready`);
    test.skip(!ready.ok, 'API not ready');
    seed = seedDay1Master();
  });

  test.afterAll(() => {
    if (seed?.masterId) cleanupDay1Master(seed.masterId);
  });

  test('Daily Hub, schedule wizard, no horizontal scroll', async ({ page }) => {
    await injectMasterAuth(page, seed.token);

    await page.goto('/admin/overview');
    await waitForMasterCabinet(page);
    await assertNoHorizontalScroll(page);

    await page.goto('/admin/services');
    await expect(page.locator('button:has-text("Добавить услугу"):visible').first()).toBeVisible();
    await assertNoHorizontalScroll(page);

    await createServiceViaUi(page, { title: 'Mobile E2E', price: '40' });
    await assertNoHorizontalScroll(page);

    await openMonthWizard(page);
    await assertNoHorizontalScroll(page);
    await expect(page.getByRole('button', { name: 'Создать окна на месяц' })).toBeVisible();

    await page.getByRole('button', { name: 'Неделя' }).click();
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(page.getByRole('heading', { name: 'Часы приёма' })).toBeVisible();
    await assertNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(page.getByRole('heading', { name: 'Итог' })).toBeVisible();
    await assertNoHorizontalScroll(page);

    const createBtn = page.getByRole('button', { name: /Создать \d+ окон/ });
    await expect(createBtn).toBeVisible();
    const box = await createBtn.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await createBtn.click();
    await expect(page.getByText('Готово')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Создано \d+/)).toBeVisible();
    await assertNoHorizontalScroll(page);

    const footerBtn = page.getByRole('link', { name: 'Посмотреть календарь' });
    await expect(footerBtn).toBeVisible();
    const footerBox = await footerBtn.boundingBox();
    expect(footerBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
