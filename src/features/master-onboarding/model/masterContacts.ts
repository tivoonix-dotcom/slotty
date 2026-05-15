export type ContactType = 'telegram' | 'viber' | 'vk' | 'instagram' | 'whatsapp' | 'other';

export type MasterContact = {
  type: ContactType;
  value: string;
};

/** Строка в форме с локальным id для React keys */
export type MasterContactRow = MasterContact & { id: string };

export type MasterProfileStep3Payload = {
  displayName: string;
  description: string;
  phone: string;
  contacts: MasterContact[];
};

const TG_USER = /^@?[a-zA-Z0-9_]{5,32}$/;
const TG_URL = /^(https?:\/\/)?(t\.me|telegram\.me)\/[\w+/]+/i;

const IG_USER = /^@?[a-zA-Z0-9._]{1,30}$/;
const IG_URL = /^(https?:\/\/)?(www\.)?instagram\.com\//i;

const VK_URL = /^(https?:\/\/)?(www\.)?(m\.)?vk\.com\//i;
const VK_SHORT = /^@?[a-zA-Z0-9._-]{2,}$/;

const WA_URL = /^(https?:\/\/)?(www\.)?wa\.me\//i;
const VIBER_URL = /^viber:\/\//i;

function hasAnyDigit(s: string): boolean {
  return /\d/.test(s);
}

/** null = ок; строка = текст ошибки. */
export function validateContactValue(type: ContactType, raw: string): string | null {
  const v = raw.trim();
  if (!v) return 'Заполните контакт';

  switch (type) {
    case 'telegram':
      if (TG_URL.test(v) || TG_USER.test(v.replace(/^https?:\/\//i, ''))) return null;
      return 'Проверьте формат контакта';
    case 'instagram':
      if (IG_URL.test(v) || IG_USER.test(v)) return null;
      return 'Проверьте формат контакта';
    case 'vk':
      if (VK_URL.test(v) || VK_SHORT.test(v)) return null;
      return 'Проверьте формат контакта';
    case 'whatsapp':
      if (WA_URL.test(v) || hasAnyDigit(v)) return null;
      return 'Проверьте формат контакта';
    case 'viber': {
      if (VIBER_URL.test(v)) return null;
      const noScheme = v.replace(/^https?:\/\//i, '');
      if (TG_URL.test(v) || TG_URL.test(noScheme)) return 'Проверьте формат контакта';
      const tgCandidate = v.trim().replace(/^@/, '@');
      if (TG_USER.test(tgCandidate) || TG_USER.test(v.trim())) return 'Проверьте формат контакта';
      if (v.trim().startsWith('@') && !hasAnyDigit(v)) return 'Проверьте формат контакта';
      if (hasAnyDigit(v)) return null;
      return 'Проверьте формат контакта';
    }
    case 'other':
      if (v.length > 200) return 'Проверьте формат контакта';
      return null;
    default:
      return 'Проверьте формат контакта';
  }
}

const PREFIX: Record<ContactType, string> = {
  telegram: 'Telegram',
  viber: 'Viber',
  vk: 'VK',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Контакт',
};

export function contactsToLegacyContactLine(contacts: MasterContact[]): string | null {
  if (!contacts.length) return null;
  const parts = contacts
    .map((c) => {
      const val = c.value.trim();
      if (!val) return '';
      return `${PREFIX[c.type]}: ${val}`;
    })
    .filter(Boolean);
  if (!parts.length) return null;
  const line = parts.join(' · ');
  return line.length > 500 ? `${line.slice(0, 497)}…` : line;
}

export const CONTACT_CHANNEL_META: { type: ContactType; label: string; placeholder: string }[] = [
  { type: 'telegram', label: 'Telegram', placeholder: '@username или t.me/username' },
  { type: 'viber', label: 'Viber', placeholder: '+375 29 000-00-00' },
  { type: 'vk', label: 'VK', placeholder: 'vk.com/username' },
  { type: 'instagram', label: 'Instagram', placeholder: '@username или instagram.com/username' },
  { type: 'whatsapp', label: 'WhatsApp', placeholder: '+375 29 000-00-00' },
  { type: 'other', label: 'Ещё', placeholder: 'Ссылка или контакт' },
];

export function countContactsByType(rows: MasterContactRow[], type: ContactType): number {
  return rows.filter((r) => r.type === type).length;
}

export function canAddContactChannel(rows: MasterContactRow[], type: ContactType): boolean {
  if (type === 'other') return countContactsByType(rows, 'other') < 5;
  return countContactsByType(rows, type) < 1;
}
