import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

export type Day1Seed = {
  masterId: string;
  token: string;
  cleanupTag: string;
};

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'server');

export function seedDay1Master(): Day1Seed {
  const out = execSync('npx tsx src/scripts/seedPlaywrightDay1Master.ts', {
    cwd: serverRoot,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const jsonLine = out.split(/\r?\n/).find((line) => line.trim().startsWith('{'));
  if (!jsonLine) {
    throw new Error(`seedPlaywrightDay1Master: no JSON output: ${out.slice(0, 200)}`);
  }
  return JSON.parse(jsonLine) as Day1Seed;
}

export function cleanupDay1Master(masterId: string): void {
  try {
    execSync(`npx tsx src/scripts/cleanupPlaywrightDay1Master.ts ${masterId}`, {
      cwd: serverRoot,
      encoding: 'utf8',
      env: process.env,
      stdio: 'ignore',
    });
  } catch {
    /* best-effort cleanup */
  }
}

export function publishMasterProfile(masterId: string): void {
  execSync(`npx tsx src/scripts/publishPlaywrightMaster.ts ${masterId}`, {
    cwd: serverRoot,
    encoding: 'utf8',
    env: process.env,
    stdio: 'ignore',
  });
}

export async function injectMasterAuth(page: import('@playwright/test').Page, token: string): Promise<void> {
  await page.addInitScript((authToken: string) => {
    localStorage.setItem('slotty_auth_token', authToken);
  }, token);
}

export async function dismissMasterLoginOverlays(page: import('@playwright/test').Page): Promise<void> {
  const telegramHint = page.getByRole('button', { name: 'Понятно' });
  if (await telegramHint.isVisible({ timeout: 1500 }).catch(() => false)) {
    await telegramHint.click();
  }
}

export async function waitForMasterCabinet(page: import('@playwright/test').Page): Promise<void> {
  await dismissMasterLoginOverlays(page);
  await expect(
    page.getByText('Добавьте первую услугу').or(page.getByRole('heading', { name: 'Сегодня' })).first(),
  ).toBeVisible({
    timeout: 30_000,
  });
}

export async function assertNoHorizontalScroll(page: import('@playwright/test').Page): Promise<void> {
  const ok = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  if (!ok) {
    throw new Error('Horizontal scroll detected');
  }
}
