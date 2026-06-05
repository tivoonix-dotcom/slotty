/** Нормализация имён и названий для UI (синхронно с server/src/lib/displayFormat.ts). */

const BLOCKED_CLIENT_TOKENS = new Set([
  'чат',
  'chat',
  'user',
  'telegram user',
  'unknown',
  'undefined',
  'null',
  'demo',
  'test',
  'draft',
]);

const SERVICE_SUFFIX_RE =
  /\s+(копия|copy|тест|test|демо|demo|черновик|draft)(?:\s*\d*)?\s*$/iu;

export type ClientNameFields = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  telegram_username?: string | null;
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function isBlockedDisplayValue(value: string | null | undefined): boolean {
  if (!value) return true;
  const t = normalizeToken(value);
  return t.length === 0 || BLOCKED_CLIENT_TOKENS.has(t);
}

function looksLikePhoneNumber(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().replace(/\s/g, '');
  if (!normalized) return false;
  return /^\+?\d[\d()-]{5,}$/.test(normalized);
}

export function isUsableProfileFullName(value: string | null | undefined): boolean {
  const trimmed = value?.trim() || '';
  return trimmed.length > 0 && !isBlockedDisplayValue(trimmed) && !looksLikePhoneNumber(trimmed);
}

function looksLikeRealSingleName(word: string): boolean {
  return /^[А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-z-]{2,}$/.test(word.trim());
}

export function formatClientName(row: ClientNameFields): string {
  const first = row.first_name?.trim() || '';
  const last = row.last_name?.trim() || '';
  if (first && last && !isBlockedDisplayValue(first) && !isBlockedDisplayValue(last)) {
    return `${first} ${last}`.trim();
  }

  const name = row.full_name?.trim() || '';
  const parts = name.split(/\s+/).filter(Boolean);
  const phone = row.phone?.trim() || null;
  const username = row.telegram_username?.trim().replace(/^@+/, '') || null;

  if (isUsableProfileFullName(name)) {
    if (parts.length >= 2) return name;
    if (phone) return `${name} · ${phone}`;
    if (username) return `${name} (@${username})`;
    return name;
  }

  if (parts.length >= 2 && !parts.some((p) => isBlockedDisplayValue(p))) {
    return name;
  }

  if (username) {
    const handle = `@${username}`;
    if (
      parts.length === 1 &&
      name.length >= 3 &&
      looksLikeRealSingleName(parts[0]!) &&
      !isBlockedDisplayValue(parts[0])
    ) {
      return `${name} (${handle})`;
    }
    return handle;
  }

  if (phone) {
    if (parts.length === 1 && looksLikeRealSingleName(parts[0]!) && !isBlockedDisplayValue(parts[0])) {
      return `${name} · ${phone}`;
    }
    return phone;
  }

  if (parts.length === 1 && name.length >= 2 && !isBlockedDisplayValue(parts[0])) {
    return name;
  }

  return 'Клиент SLOTTY';
}

export function formatMasterName(raw: string | null | undefined, fallback = 'Мастер'): string {
  const n = raw?.trim() || '';
  if (!n || isBlockedDisplayValue(n)) return fallback;
  return n;
}

export function formatServiceName(raw: string | null | undefined, fallback = 'Услуга'): string {
  const title = raw?.trim() || '';
  if (!title) return fallback;
  let cleaned = title;
  for (let i = 0; i < 3; i++) {
    const next = cleaned.replace(SERVICE_SUFFIX_RE, '').trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  if (!cleaned || isBlockedDisplayValue(cleaned)) return fallback;
  return cleaned;
}
