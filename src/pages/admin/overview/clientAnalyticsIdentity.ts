import { normalizeBelarusPhone } from '../../../features/profile/lib/belarusPhone';

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

function isBlockedDisplayValue(value: string | null | undefined): boolean {
  if (!value) return true;
  const t = value.trim().toLowerCase();
  return t.length === 0 || BLOCKED_CLIENT_TOKENS.has(t);
}

function looksLikePhoneNumber(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().replace(/\s/g, '');
  if (!normalized) return false;
  return /^\+?\d[\d()-]{5,}$/.test(normalized);
}

function isUsableProfileFullName(value: string | null | undefined): boolean {
  const trimmed = value?.trim() || '';
  return trimmed.length > 0 && !isBlockedDisplayValue(trimmed) && !looksLikePhoneNumber(trimmed);
}

function pickClientFullNameForDisplay(
  nameSnapshot: string | null | undefined,
  profileFullName: string | null | undefined,
): string {
  const snapshot = nameSnapshot?.trim() || '';
  const profile = profileFullName?.trim() || '';

  const profileIsUsable =
    profile.length > 0 && !isBlockedDisplayValue(profile) && !looksLikePhoneNumber(profile);
  if (profileIsUsable) return profile;

  if (snapshot && !isBlockedDisplayValue(snapshot) && !looksLikePhoneNumber(snapshot)) {
    return snapshot;
  }

  return profile || snapshot;
}

export type ClientAnalyticsIdentityInput = {
  appointmentId: string;
  clientId?: string | null;
  profileFullName?: string | null;
  nameSnapshot?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneSnapshot?: string | null;
  email?: string | null;
  emailSnapshot?: string | null;
};

export function resolveClientPhone(
  input: Pick<ClientAnalyticsIdentityInput, 'phone' | 'phoneSnapshot'>,
): string | null {
  return input.phoneSnapshot?.trim() || input.phone?.trim() || null;
}

export function resolveClientEmail(
  input: Pick<ClientAnalyticsIdentityInput, 'email' | 'emailSnapshot'>,
): string | null {
  return input.emailSnapshot?.trim() || input.email?.trim() || null;
}

export function normalizePhoneForClientKey(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const normalized = normalizeBelarusPhone(trimmed);
  if (normalized.ok && normalized.compact) {
    return normalized.compact.replace(/\D/g, '');
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.length === 12 && digits.startsWith('375')) return digits;
  if (digits.length === 11 && digits.startsWith('80')) return `375${digits.slice(2)}`;
  if (digits.length === 9) return `375${digits}`;
  return digits;
}

export function resolveClientAnalyticsDisplayName(input: ClientAnalyticsIdentityInput): string {
  const fullName = pickClientFullNameForDisplay(input.nameSnapshot, input.profileFullName);
  if (isUsableProfileFullName(fullName)) return fullName.trim();

  const first = input.firstName?.trim() || '';
  const last = input.lastName?.trim() || '';
  if (first && last && !isBlockedDisplayValue(first) && !isBlockedDisplayValue(last)) {
    return `${first} ${last}`.trim();
  }
  if (first && !isBlockedDisplayValue(first) && !looksLikePhoneNumber(first)) return first;

  return 'Клиент без имени';
}

export function buildClientAnalyticsKey(input: ClientAnalyticsIdentityInput): string {
  const clientId = input.clientId?.trim();
  if (clientId) return `id:${clientId}`;

  const phone = normalizePhoneForClientKey(resolveClientPhone(input));
  if (phone) return `phone:${phone}`;

  const email = resolveClientEmail(input)?.toLowerCase();
  if (email) return `email:${email}`;

  return `appt:${input.appointmentId}`;
}

export function preferAnalyticsDisplayName(current: string, next: string): string {
  const cur = current.trim() || 'Клиент без имени';
  const nxt = next.trim() || 'Клиент без имени';
  if (cur === 'Клиент без имени' && nxt !== 'Клиент без имени') return nxt;
  if (looksLikePhoneNumber(cur) && !looksLikePhoneNumber(nxt)) return nxt;
  if (nxt.length > cur.length && nxt !== 'Клиент без имени') return nxt;
  return cur;
}

/** Телефон не должен становиться primary name в карточке клиента. */
export function isPhoneLikeDisplayName(value: string): boolean {
  return looksLikePhoneNumber(value);
}
