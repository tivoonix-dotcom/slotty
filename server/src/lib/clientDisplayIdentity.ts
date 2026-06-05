import {
  formatClientName,
  formatMasterName,
  isBlockedDisplayValue,
  looksLikePhoneNumber,
  pickClientFullNameForDisplay,
} from './displayFormat.js';

export type ClientDisplayIdentityInput = {
  masterDisplayName?: string | null;
  masterPhotoUrl?: string | null;
  profileFullName?: string | null;
  profileAvatarUrl?: string | null;
  nameSnapshot?: string | null;
  phone?: string | null;
  phoneSnapshot?: string | null;
  telegramUsername?: string | null;
};

export function resolveClientPhone(input: ClientDisplayIdentityInput): string | null {
  return input.phoneSnapshot?.trim() || input.phone?.trim() || null;
}

/** Имя автора отзыва / клиента в кабинете мастера — без телефона в заголовке. */
export function resolveClientDisplayName(input: ClientDisplayIdentityInput): string {
  const masterName = input.masterDisplayName?.trim() || '';
  if (masterName && !isBlockedDisplayValue(masterName) && !looksLikePhoneNumber(masterName)) {
    return formatMasterName(masterName, 'Мастер');
  }

  const phone = resolveClientPhone(input);
  const telegram = input.telegramUsername?.trim().replace(/^@+/, '') || null;
  const fullName = pickClientFullNameForDisplay(input.nameSnapshot, input.profileFullName);

  const formatted = formatClientName({
    full_name: fullName,
    phone,
    telegram_username: telegram,
  });

  if (!looksLikePhoneNumber(formatted) && formatted !== 'Клиент SLOTTY') {
    return formatted;
  }

  if (telegram) return `@${telegram}`;
  return 'Клиент';
}

export function resolveClientAvatarUrl(input: ClientDisplayIdentityInput): string | null {
  const masterPhoto = input.masterPhotoUrl?.trim();
  if (masterPhoto) return masterPhoto;
  return input.profileAvatarUrl?.trim() || null;
}

export function resolveClientDisplayIdentity(input: ClientDisplayIdentityInput) {
  return {
    displayName: resolveClientDisplayName(input),
    avatarUrl: resolveClientAvatarUrl(input),
    phone: resolveClientPhone(input),
  };
}
