export type BelarusPhoneResult =
  | { ok: true; compact: string | null }
  | { ok: false; message: string };

/** Empty input → clear (null). */
export function normalizeBelarusPhone(raw: string | undefined | null): BelarusPhoneResult {
  if (raw == null) return { ok: true, compact: null };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, compact: null };

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('80') && digits.length === 11) {
    digits = `375${digits.slice(2)}`;
  }
  if (!digits.startsWith('375')) {
    return { ok: false, message: 'Введите корректный номер Беларуси' };
  }
  if (digits.length !== 12) {
    return { ok: false, message: 'Введите корректный номер Беларуси' };
  }
  return { ok: true, compact: `+${digits}` };
}

export function formatBelarusPhoneDisplay(compact: string): string {
  const d = compact.replace(/\D/g, '');
  if (!d.startsWith('375') || d.length !== 12) return compact;
  const r = d.slice(3);
  return `+375 ${r.slice(0, 2)} ${r.slice(2, 5)} ${r.slice(5, 7)} ${r.slice(7)}`;
}
