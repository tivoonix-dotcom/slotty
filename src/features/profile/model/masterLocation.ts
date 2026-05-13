/**
 * Публичный адрес мастера (демо + будущий Supabase).
 * TODO: подключить геокодинг адреса.
 * TODO: сохранять location в Supabase masters_metadata.
 * TODO: добавить координаты lat/lng для карты.
 * TODO: добавить проверку адреса через внешний API.
 * TODO: скрывать sensitive-инструкции до подтверждения записи, если потребуется.
 */

/** «В салоне» или «На дому» (у клиента / домашний формат — уточняется в описании). */
export type MasterVisitType = 'studio' | 'at_home';

export type MasterLocation = {
  visitType: MasterVisitType;
  /** @deprecated оставлено для старых JSON; в UI не используем */
  city?: string;
  /** Основная строка адреса (поиск / карта / геокодер). */
  street: string;
  /** Доп. уточнение (подъезд, корпус) — опционально */
  building: string;
  entrance?: string;
  floor?: string;
  room?: string;
  intercom?: string;
  landmark?: string;
  directions?: string;
  clientNote?: string;
  district?: string;
  homeVisitMinPriceByn?: number;
  homeVisitComment?: string;
  onlineChannel?: string;
  onlineComment?: string;
  otherNote?: string;
  lat?: number;
  lng?: number;
};

const VISIT_LABEL: Record<MasterVisitType, string> = {
  studio: 'В салоне / кабинете',
  at_home: 'На дому',
};

export function masterVisitTypeLabel(t: MasterVisitType): string {
  return VISIT_LABEL[t] ?? t;
}

function baseAddressLine(loc: MasterLocation): string {
  const s = loc.street.trim();
  const b = loc.building.trim();
  if (s && b) return `${s}, ${b}`;
  return s || b;
}

/** Короткая строка для карточек */
export function formatPublicAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const base = baseAddressLine(loc);
  if (loc.visitType === 'at_home') {
    return base ? `На дому · ${base}` : 'На дому';
  }
  return base || 'Адрес уточняется';
}

/** Полная строка для подтверждений и «как добраться» одной строкой */
export function formatFullAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const base = formatPublicAddress(loc);
  const tail: string[] = [];
  if (loc.entrance?.trim()) tail.push(`вход: ${loc.entrance.trim()}`);
  if (loc.floor?.trim()) tail.push(loc.floor.trim());
  if (loc.room?.trim()) tail.push(loc.room.trim());
  if (loc.intercom?.trim()) tail.push(loc.intercom.trim());
  if (loc.landmark?.trim()) tail.push(`ориентир: ${loc.landmark.trim()}`);
  if (loc.directions?.trim()) tail.push(loc.directions.trim());
  if (loc.clientNote?.trim()) tail.push(loc.clientNote.trim());
  return tail.length ? `${base} · ${tail.join(' · ')}` : base;
}

/** Текст блока «Как пройти» на экране записи (компактно). */
export function formatBookingHowToFind(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const parts: string[] = [];
  if (loc.floor?.trim()) parts.push(loc.floor.trim());
  if (loc.room?.trim()) parts.push(loc.room.trim());
  if (loc.entrance?.trim()) parts.push(`вход ${loc.entrance.trim()}`);
  if (loc.directions?.trim()) parts.push(loc.directions.trim());
  return parts.join('. ') || baseAddressLine(loc);
}

/** Строка для поиска по адресу */
export function masterLocationSearchHaystack(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const bits = [
    loc.city,
    loc.street,
    loc.building,
    loc.district,
    loc.landmark,
    loc.entrance,
    loc.room,
    loc.floor,
    loc.intercom,
    loc.directions,
    loc.clientNote,
    loc.onlineChannel,
    loc.homeVisitComment,
    loc.otherNote,
    formatPublicAddress(loc),
    masterVisitTypeLabel(loc.visitType),
  ];
  return bits.map((s) => (s ?? '').trim().toLowerCase()).filter(Boolean).join(' ');
}

/** Строки для UI «Подробнее» / профиль мастера */
export function masterLocationDetailRows(loc: MasterLocation | null | undefined): { label: string; value: string }[] {
  if (!loc) return [];
  const rows: { label: string; value: string }[] = [];
  rows.push({ label: 'Формат', value: masterVisitTypeLabel(loc.visitType) });
  rows.push({ label: 'Адрес', value: baseAddressLine(loc) || '—' });
  if (loc.entrance?.trim()) rows.push({ label: 'Вход', value: loc.entrance.trim() });
  if (loc.floor?.trim()) rows.push({ label: 'Этаж', value: loc.floor.trim() });
  if (loc.room?.trim()) rows.push({ label: 'Кабинет', value: loc.room.trim() });
  if (loc.intercom?.trim()) rows.push({ label: 'Домофон / ресепшен', value: loc.intercom.trim() });
  if (loc.landmark?.trim()) rows.push({ label: 'Ориентир', value: loc.landmark.trim() });
  if (loc.directions?.trim()) rows.push({ label: 'Как пройти', value: loc.directions.trim() });
  if (loc.clientNote?.trim()) rows.push({ label: 'Комментарий мастера', value: loc.clientNote.trim() });
  return rows;
}
