/** Нормализация и проверка мобильного номера РБ. */

const BY_MOBILE_PREFIX = new Set(['25', '29', '33', '44']);

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

/** `+375 29 123 45 67` или null. */
export function normalizeBelarusPhone(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let d = onlyDigits(t);
  if (d.length === 12 && d.startsWith('375')) {
    // ok
  } else if (d.length === 11 && d.startsWith('80')) {
    d = `375${d.slice(2)}`;
  } else if (d.length === 9) {
    d = `375${d}`;
  } else {
    return null;
  }
  if (d.length !== 12 || !d.startsWith('375')) return null;
  const op = d.slice(3, 5);
  if (!BY_MOBILE_PREFIX.has(op)) return null;
  const rest = d.slice(5);
  if (rest.length !== 7) return null;
  return `+375 ${op} ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5)}`;
}

export function isOptionalBelarusPhoneValid(raw: string): boolean {
  if (!raw.trim()) return true;
  return normalizeBelarusPhone(raw) != null;
}
