export type MasterContactType = 'telegram' | 'viber' | 'vk' | 'instagram' | 'whatsapp' | 'other';

export type MasterContactPayload = {
  type: MasterContactType;
  value: string;
};

const PREFIX: Record<MasterContactType, string> = {
  telegram: 'Telegram',
  viber: 'Viber',
  vk: 'VK',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Контакт',
};

/** Краткая строка для legacy-поля `contact` (до 500 символов). */
export function contactsToLegacyContactLine(contacts: MasterContactPayload[] | null | undefined): string | null {
  if (!contacts?.length) return null;
  const parts = contacts
    .map((c) => {
      const v = c.value.trim();
      if (!v) return '';
      return `${PREFIX[c.type]}: ${v}`;
    })
    .filter(Boolean);
  if (!parts.length) return null;
  const line = parts.join(' · ');
  return line.length > 500 ? `${line.slice(0, 497)}…` : line;
}

export function parseContactsJson(raw: unknown): MasterContactPayload[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out: MasterContactPayload[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const t = o.type;
    const v = o.value;
    if (
      t === 'telegram' ||
      t === 'viber' ||
      t === 'vk' ||
      t === 'instagram' ||
      t === 'whatsapp' ||
      t === 'other'
    ) {
      if (typeof v === 'string' && v.trim()) {
        out.push({ type: t, value: v.trim() });
      }
    }
  }
  return out.length ? out : null;
}
