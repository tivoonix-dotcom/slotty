/**
 * Контакты поддержки SLOTTY (замените на реальные перед продакшеном).
 * Не дублируйте строки в компонентах — импортируйте отсюда.
 */
export const SUPPORT_TELEGRAM = '[указать Telegram поддержки]';
export const SUPPORT_EMAIL = '[указать email поддержки]';

export function isPlaceholderContact(value: string): boolean {
  return /^\[.*]$/.test(value.trim());
}

export function supportTelegramUrl(usernameOrHandle: string): string | null {
  const t = usernameOrHandle.trim();
  if (!t || isPlaceholderContact(t)) return null;
  const h = t.startsWith('@') ? t.slice(1) : t;
  if (!/^[a-zA-Z0-9_]{3,64}$/.test(h)) return null;
  return `https://t.me/${h}`;
}
