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
  /** Дом / корпус (деталь), опционально */
  buildingDetail?: string;
  /** Название салона / студии (studio) */
  salonName?: string;
  entrance?: string;
  floor?: string;
  room?: string;
  intercom?: string;
  landmark?: string;
  directions?: string;
  clientNote?: string;
  district?: string;
  /** Для at_home: точный адрес в каталоге только после записи */
  showExactAddressAfterBooking?: boolean;
  homeVisitMinPriceByn?: number;
  homeVisitComment?: string;
  onlineChannel?: string;
  onlineComment?: string;
  otherNote?: string;
  lat?: number;
  lng?: number;
};

const VISIT_LABEL: Record<MasterVisitType, string> = {
  studio: 'Салон',
  at_home: 'На дому',
};

export function masterVisitTypeLabel(t: MasterVisitType): string {
  return VISIT_LABEL[t] ?? t;
}

function baseAddressLine(loc: MasterLocation): string {
  const s = loc.street.trim();
  const b = loc.building.trim();
  if (s && b && b !== 'б/н') return `${s}, ${b}`;
  return s || (b !== 'б/н' ? b : '');
}

function cityLabel(loc: MasterLocation): string {
  return (loc.city ?? '').trim() || 'Минск';
}

/** Дом/корпус уже есть в строке улицы (часто после геокодера). */
function buildingRedundantWithStreet(street: string, building: string): boolean {
  const b = building.trim();
  if (!b || b === 'б/н') return true;
  const s = street.trim().toLowerCase();
  if (!s) return false;
  if (s === b.toLowerCase()) return true;
  if (s.endsWith(`, ${b.toLowerCase()}`)) return true;
  if (s.includes(b.toLowerCase())) return true;
  return false;
}

/** Короткая строка для карточек */
export function formatPublicAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const base = baseAddressLine(loc);
  if (loc.visitType === 'at_home') {
    if (loc.showExactAddressAfterBooking === true) {
      const c = cityLabel(loc);
      const street = loc.street.trim();
      if (street) return `На дому · ${c}, ${street}`;
      const d = loc.district?.trim();
      if (d) return `На дому · ${c}, ${d}`;
      return `На дому · ${c}`;
    }
    return base ? `На дому · ${base}` : 'На дому';
  }
  if (!base) return 'Адрес пока не указан';
  const salon = loc.salonName?.trim();
  return salon ? `${salon} · ${base}` : base;
}

/**
 * Строка «до записи» для at_home: город + поле «Адрес приёма» (улица/район),
 * без дома, подъезда и прочих деталей из «Дополнительно».
 */
export function formatHomePublicBeforeBooking(loc: MasterLocation | null | undefined): string {
  if (!loc || loc.visitType !== 'at_home') return '';
  const c = cityLabel(loc);
  const street = loc.street.trim();
  if (street) return `${c}, ${street}`;
  const d = loc.district?.trim();
  return d ? `${c}, ${d}` : c;
}

/** Основная строка адреса с городом (салон или полный адрес без режима скрытия). */
export function formatCityWithAddressLine(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const c = cityLabel(loc);
  const line = baseAddressLine(loc);
  return line ? `${c}, ${line}` : c;
}

/** Полная строка «после записи» для at_home: город, улица, дом (если не дублируется). */
export function formatHomeAfterBookingMainLine(loc: MasterLocation | null | undefined): string {
  if (!loc || loc.visitType !== 'at_home') return formatCityWithAddressLine(loc);
  const c = cityLabel(loc);
  const street = loc.street.trim();
  const building = loc.building.trim();
  const parts: string[] = [];
  if (street) parts.push(street);
  if (building && building !== 'б/н' && !buildingRedundantWithStreet(street, building)) {
    parts.push(building);
  }
  const line = parts.join(', ');
  return line ? `${c}, ${line}` : c;
}

/** Детали приёма на дому — только из «Дополнительно», после записи. */
export function homeAfterBookingDetailLines(loc: MasterLocation | null | undefined): string[] {
  if (!loc || loc.visitType !== 'at_home') return [];
  const lines: string[] = [];
  if (loc.buildingDetail?.trim()) lines.push(loc.buildingDetail.trim());
  if (loc.entrance?.trim()) lines.push(`подъезд ${loc.entrance.trim()}`);
  if (loc.floor?.trim()) lines.push(`этаж ${loc.floor.trim()}`);
  if (loc.room?.trim()) lines.push(`квартира ${loc.room.trim()}`);
  if (loc.intercom?.trim()) lines.push(`код домофона ${loc.intercom.trim()}`);
  if (loc.directions?.trim()) lines.push(loc.directions.trim());
  if (loc.clientNote?.trim()) lines.push(`Комментарий: ${loc.clientNote.trim()}`);
  return lines;
}

/** Адрес в карточке записи клиента (уже после бронирования). */
export function formatClientAppointmentAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  if (loc.visitType === 'at_home') {
    const main = formatHomeAfterBookingMainLine(loc);
    const tail = homeAfterBookingDetailLines(loc);
    return tail.length ? `${main} · ${tail.join(' · ')}` : main;
  }
  return formatCityWithAddressLine(loc);
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
    loc.buildingDetail,
    loc.salonName,
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

/** Строки для UI «Подробнее» / профиль / детали записи */
export function masterLocationDetailRows(
  loc: MasterLocation | null | undefined,
  opts?: { revealed?: boolean },
): { label: string; value: string }[] {
  if (!loc) return [];
  const revealed = opts?.revealed === true;
  const rows: { label: string; value: string }[] = [];
  rows.push({ label: 'Формат', value: masterVisitTypeLabel(loc.visitType) });
  if (loc.salonName?.trim()) rows.push({ label: 'Салон', value: loc.salonName.trim() });
  const addressValue =
    loc.visitType === 'at_home' && loc.showExactAddressAfterBooking === true && !revealed
      ? loc.street.trim() || '—'
      : loc.visitType === 'at_home'
        ? formatHomeAfterBookingMainLine(loc)
        : baseAddressLine(loc) || '—';
  rows.push({ label: 'Адрес', value: addressValue });

  if (loc.visitType === 'at_home' && loc.showExactAddressAfterBooking === true && !revealed) {
    return rows;
  }

  if (loc.visitType === 'at_home' && revealed && loc.showExactAddressAfterBooking === true) {
    for (const line of homeAfterBookingDetailLines(loc)) {
      rows.push({ label: ' ', value: line });
    }
    return rows;
  }

  if (loc.buildingDetail?.trim()) rows.push({ label: 'Дом / корпус', value: loc.buildingDetail.trim() });
  if (loc.district?.trim()) rows.push({ label: 'Район / метро', value: loc.district.trim() });
  if (loc.entrance?.trim()) rows.push({ label: 'Вход', value: loc.entrance.trim() });
  if (loc.floor?.trim()) rows.push({ label: 'Этаж', value: loc.floor.trim() });
  if (loc.room?.trim()) rows.push({ label: 'Кабинет', value: loc.room.trim() });
  if (loc.intercom?.trim()) rows.push({ label: 'Домофон / ресепшен', value: loc.intercom.trim() });
  if (loc.landmark?.trim()) rows.push({ label: 'Ориентир', value: loc.landmark.trim() });
  if (loc.directions?.trim()) rows.push({ label: 'Как пройти', value: loc.directions.trim() });
  if (loc.clientNote?.trim()) rows.push({ label: 'Комментарий мастера', value: loc.clientNote.trim() });
  return rows;
}
