/** Синхронное чтение start_param из классического Telegram WebApp (если есть). */
export function readTelegramWebAppStartParam(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const unsafe = (
    window as unknown as {
      Telegram?: { WebApp?: { initDataUnsafe?: { start_param?: string } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.start_param;
  const s = typeof unsafe === 'string' ? unsafe.trim() : '';
  return s || undefined;
}
