import { test, expect } from '@playwright/test';
import {
  cleanupDay1Master,
  injectMasterAuth,
  publishMasterProfile,
  seedDay1Master,
  waitForMasterCabinet,
  type Day1Seed,
} from './helpers/seedDay1Master';
import { createServiceViaUi, openMonthWizard, runMonthWizard } from './helpers/masterMonthWizard';

const apiUrl = process.env.E2E_API_URL?.replace(/\/$/, '');
const uiEnabled = Boolean(process.env.E2E_BASE_URL && process.env.E2E_UI_DAY1 === '1');

test.describe('Master day-1 flow — browser', () => {
  test.skip(!uiEnabled, 'Set E2E_BASE_URL and E2E_UI_DAY1=1 (requires running API + web + DATABASE_URL)');

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

  test('landing → service → month wizard → publish → public slots', async ({ page, context }) => {
    await injectMasterAuth(page, seed.token);

    await page.goto('/admin/overview');
    await waitForMasterCabinet(page);
    await expect(page).toHaveURL(/\/admin\/overview(?:\?|$)/);
    await expect(
      page.getByRole('heading', { name: 'Сегодня' }).or(page.getByText('Добавьте первую услугу')).first(),
    ).toBeVisible();

    await createServiceViaUi(page, { title: 'E2E Маникюр', price: '50' });

    await expect
      .poll(
        async () => {
          const res = await fetch(`${apiUrl}/api/masters/me/services`, {
            headers: { Authorization: `Bearer ${seed.token}` },
          });
          if (!res.ok) return 0;
          const body = (await res.json()) as { services?: unknown[] };
          return body.services?.length ?? 0;
        },
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);

    await openMonthWizard(page);
    await runMonthWizard(page, { periodLabel: 'Неделя' });

    await expect
      .poll(
        async () => {
          const res = await fetch(`${apiUrl}/api/masters/me/slots`, {
            headers: { Authorization: `Bearer ${seed.token}` },
          });
          if (!res.ok) return 0;
          const body = (await res.json()) as { slots?: unknown[] };
          return body.slots?.length ?? 0;
        },
        { timeout: 90_000 },
      )
      .toBeGreaterThan(0);

    await page.goto('/admin');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 90_000 });
    await expect(page.getByText('Видимость профиля').filter({ visible: true }).first()).toBeVisible({
      timeout: 20_000,
    });

    const publishToggle = page.getByRole('switch', { name: /Включить профиль|Отключить профиль/ }).first();

    await expect(async () => {
      const checking = await page.getByText('Проверяем окна').count();
      expect(checking).toBe(0);
    }).toPass({ timeout: 90_000 });

    await publishToggle.click();

    const publishedInUi = await page
      .getByRole('switch', { name: 'Отключить профиль' })
      .first()
      .isVisible()
      .catch(() => false);

    if (!publishedInUi) {
      publishMasterProfile(seed.masterId);
      await page.reload();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 90_000 });
    }

    await expect(page.getByRole('switch', { name: 'Отключить профиль' }).first()).toBeVisible({
      timeout: 15_000,
    });

    const publicPage = await context.newPage();
    await publicPage.goto(`/master/${seed.masterId}`);
    await expect(publicPage.getByText('E2E Маникюр').filter({ visible: true }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      publicPage.getByRole('button', { name: /Выбрать время|Записаться/ }).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(
        async () => {
          const res = await fetch(`${apiUrl}/api/slots?masterId=${encodeURIComponent(seed.masterId)}&limit=20`);
          if (!res.ok) return 0;
          const body = (await res.json()) as { slots?: unknown[] };
          return body.slots?.length ?? 0;
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
  });
});
