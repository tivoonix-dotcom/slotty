import { normalizeBelarusPhone } from '../utils/belarusPhone.js';
import {
  isBlockedDisplayValue,
  isUsableProfileFullName,
  looksLikePhoneNumber,
  pickClientFullNameForDisplay,
} from './displayFormat.js';

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

/** Ключ группировки: только цифры, единый формат для РБ. */
export function normalizePhoneForClientKey(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const normalized = normalizeBelarusPhone(trimmed);
  if (normalized) return normalized.replace(/\D/g, '');

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.length === 12 && digits.startsWith('375')) return digits;
  if (digits.length === 11 && digits.startsWith('80')) return `375${digits.slice(2)}`;
  if (digits.length === 9) return `375${digits}`;
  return digits;
}

/** Имя клиента для аналитики — телефон никогда не подставляется как primary name. */
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
