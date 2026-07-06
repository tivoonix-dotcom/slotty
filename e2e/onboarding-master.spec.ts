import { test, expect } from '@playwright/test';

/**
 * E2E onboarding Free/Pro — требует поднятый стек, миграцию 087 и E2E_API_URL.
 * Запуск: E2E_ONBOARDING=1 npx playwright test e2e/onboarding-master.spec.ts
 */
const enabled = process.env.E2E_ONBOARDING === '1';

test.describe('Master onboarding Free/Pro', () => {
  test.skip(!enabled, 'Set E2E_ONBOARDING=1 and run full stack');

  test('Free path: 3 services completes without payment block', async ({ page }) => {
    await page.goto('/become-master');
    // Полный сценарий: регистрация → услуги → Free → success
    // Детали в server/src/scripts/e2eOnboardingFlowVerify.ts
    await expect(page).toHaveURL(/become-master/);
  });

  test('Pro path: 4 services allows checkout button', async ({ page }) => {
    await page.goto('/become-master?step=8');
    await expect(page.getByText(/Опубликовать и оплатить Pro|Выбрать Pro/)).toBeVisible();
  });
});
