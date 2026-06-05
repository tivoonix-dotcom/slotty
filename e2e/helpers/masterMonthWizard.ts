import { expect, type Page } from '@playwright/test';

export async function openMonthWizard(page: Page): Promise<void> {
  await page.goto('/admin/schedule?tab=create');
  await expect(page.getByRole('button', { name: 'Создать окна на месяц' })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Создать окна на месяц' }).click();
  await expect(page.getByText('Создать окна на период')).toBeVisible();
}

export async function runMonthWizard(page: Page, opts?: { periodLabel?: string }): Promise<void> {
  const period = opts?.periodLabel ?? 'Неделя';
  await page.getByRole('button', { name: period }).click();
  await page.getByRole('button', { name: 'Далее' }).click();

  await expect(page.getByRole('heading', { name: 'Часы приёма' })).toBeVisible();
  await page.getByRole('button', { name: 'Далее' }).click();

  await expect(page.getByRole('heading', { name: 'Итог' })).toBeVisible();
  const createBtn = page.getByRole('button', { name: /Создать \d+ окон/ });
  await expect(createBtn).toBeEnabled();
  await createBtn.click();

  await expect(page.getByText('Готово')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Создано \d+/).first()).toBeVisible();
}

export async function createServiceViaUi(
  page: Page,
  opts: { title: string; price: string },
): Promise<void> {
  await page.goto('/admin/services');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 90_000 });

  const addBtn = page.locator('button:has-text("Добавить услугу"):visible:enabled').first();
  await expect(addBtn).toBeVisible({ timeout: 90_000 });
  await addBtn.click();
  await expect(page.getByText('Новая услуга')).toBeVisible();

  await page.locator('label:has-text("Название услуги") input').fill(opts.title);
  await page.locator('label:has-text("Цена") input').fill(opts.price);
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByText('Новая услуга')).toBeHidden({ timeout: 20_000 });
}
