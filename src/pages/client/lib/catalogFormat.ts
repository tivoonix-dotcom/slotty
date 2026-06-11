import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import { isSameCalendarDay, addDays } from '../../../features/booking/lib/calendar';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';
import { getServiceCategoryLabel, isCategorySlug } from '../../../features/catalog/serviceCategoryLabels';

export { formatReviewsCountLabel };

export function formatPriceFrom(price: number): string {
  const n = Number.isFinite(price) ? price : 0;
  if (n <= 0) return 'цена по запросу';
  return `от ${Math.round(n)} BYN`;
}

export function formatDurationMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}

export function formatPortfolioWorksLabel(count: number): string {
  const n = Math.max(0, Math.round(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'работа'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'работы'
        : 'работ';
  return `${n} ${word}`;
}

export function formatProfilePhotosLabel(count: number): string {
  const n = Math.max(0, Math.round(count));
  if (n <= 0) return '';
  return `${n} фото`;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} м`;
  return `${km.toFixed(1).replace('.', ',')} км`;
}

/** Адрес / формат визита + расстояние для карточки услуги в каталоге. */
export function formatServiceCardMetaLocationLine(opts: {
  locationLabel?: string | null;
  visitLabel?: string | null;
  distanceKm?: number | null;
}): string | null {
  const distance = formatDistanceKm(opts.distanceKm);
  const place = opts.locationLabel?.trim() || opts.visitLabel?.trim() || null;
  if (distance && place) return `${distance} · ${place}`;
  if (distance) return distance;
  return place;
}

/** Точные или приближённые координаты мастера для расчёта расстояния. */
export function masterDistanceCoords(loc: {
  lat?: number | null;
  lng?: number | null;
  distanceLat?: number | null;
  distanceLng?: number | null;
}): { lat: number | null; lng: number | null } {
  const lat =
    loc.lat != null && Number.isFinite(loc.lat)
      ? loc.lat
      : loc.distanceLat != null && Number.isFinite(loc.distanceLat)
        ? loc.distanceLat
        : null;
  const lng =
    loc.lng != null && Number.isFinite(loc.lng)
      ? loc.lng
      : loc.distanceLng != null && Number.isFinite(loc.distanceLng)
        ? loc.distanceLng
        : null;
  return { lat, lng };
}

export function listingDistanceKm(
  listing: ServiceListingRecord,
  userLat: number | null,
  userLng: number | null,
): number | null {
  const { lat, lng } = masterDistanceCoords(listing.location);
  if (userLat == null || userLng == null || lat == null || lng == null) return null;
  return haversineKm(userLat, userLng, lat, lng);
}

export function formatNearestSlotLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (isSameCalendarDay(d, now)) return `Сегодня ${time}`;
  const tomorrow = addDays(now, 1);
  if (isSameCalendarDay(d, tomorrow)) return `Завтра ${time}`;
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
}

export function isSlotToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && isSameCalendarDay(d, new Date());
}

export function visitFormatLabel(listing: ServiceListingRecord): string {
  return masterVisitTypeLabel(listing.location.visitType);
}

export function formatMasterCategoryLabel(category: string): string {
  const c = category.trim();
  if (!c || c === 'Мастер') return 'Beauty-мастер';
  if (/мастер/i.test(c)) return c;
  return `Мастер · ${c}`;
}

/** Подпись категории на карточке услуги — нормальный регистр, без капса. */
export function formatServiceCardCategoryLabel(
  categoryName: string,
  categoryCode?: string,
): string {
  let label = categoryCode?.trim()
    ? getServiceCategoryLabel(categoryCode)
    : categoryName.trim();
  if (!label || label === 'Услуга') {
    label = categoryName.trim() || 'Услуга';
  }
  if (isCategorySlug(label)) {
    label = getServiceCategoryLabel(label);
  }
  if (label.length > 1 && label === label.toUpperCase()) {
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }
  return label;
}

/** Подпись специализации на карточке мастера («Мастер маникюра»). */
export function formatMasterCardSpecialty(category: string): string {
  const c = category.trim();
  if (!c || c === 'Мастер') return 'Beauty-мастер';
  if (/^мастер\s/i.test(c)) return c;
  const label = isCategorySlug(c) ? getServiceCategoryLabel(c) : c;
  if (label === 'Услуга') return 'Beauty-мастер';
  return `Мастер ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

export function visitFormatChipLabel(listing: ServiceListingRecord): string {
  return listing.location.visitType === 'at_home' ? 'На дому' : 'В студии';
}

/** Короткая локация для чипа («Минск, Центр»). */
export function masterLocationChipLine(listing: ServiceListingRecord): string {
  const city = listing.location.city?.trim() || 'Минск';
  const district = listing.location.district?.trim();
  if (district && district !== LOCATION_EMPTY_SENTINEL) {
    const short = district.length > 22 ? `${district.slice(0, 21)}…` : district;
    return `${city}, ${short}`;
  }
  const landmark = listing.location.landmark?.trim();
  if (landmark) {
    const center = /центр/i.test(landmark);
    const districtMatch = landmark.match(/район\s+([^,.]+)/i);
    if (center && !districtMatch) return `${city}, Центр`;
    if (districtMatch?.[1]) {
      const part = districtMatch[1].trim();
      const short = part.length > 18 ? `${part.slice(0, 17)}…` : part;
      return `${city}, ${short}`;
    }
    const shortLm = landmark.length > 22 ? `${landmark.slice(0, 21)}…` : landmark;
    return `${city}, ${shortLm}`;
  }
  const street = listing.location.street?.trim();
  if (street && street !== LOCATION_EMPTY_SENTINEL) {
    const cleaned = street
      .replace(/^ул\.?\s*/i, '')
      .replace(/^улица\s*/i, '')
      .replace(/^пр-т\s*/i, '')
      .replace(/^проспект\s*/i, '');
    const short = cleaned.length > 20 ? `${cleaned.slice(0, 19)}…` : cleaned;
    return `${city}, ${short}`;
  }
  return city;
}

/** Оценка числа записей для колонки статистики (пока нет поля с бэка). */
export function estimatedBookingsCount(reviewsCount: number): number | null {
  if (reviewsCount <= 0) return null;
  return Math.max(Math.round(reviewsCount * 2.4), reviewsCount + 12);
}

export function formatMasterRatingLine(listing: ServiceListingRecord): {
  primary: string;
  secondary: string | null;
  isNew: boolean;
} {
  const reviews = listing.reviewsCount;
  const rating = listing.rating;
  if (reviews <= 0 && rating <= 0) {
    return { primary: 'Новый мастер', secondary: 'Пока без отзывов', isNew: true };
  }
  if (reviews <= 0) {
    return { primary: rating > 0 ? rating.toFixed(1) : 'Новый', secondary: 'Отзывы появятся скоро', isNew: true };
  }
  return {
    primary: rating > 0 ? rating.toFixed(1) : 'Пока нет',
    secondary: formatReviewsCountLabel(reviews),
    isNew: false,
  };
}

export function shortMasterName(name: string, maxLen = 22): string {
  const n = name.trim();
  if (n.length <= maxLen) return n;
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    const short = `${parts[0]} ${parts[1][0]}.`;
    if (short.length <= maxLen) return short;
  }
  return `${n.slice(0, maxLen - 1)}…`;
}

export function formatMastersNearbyLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 1) return '1 мастер рядом';
  if (n >= 2 && n <= 4) return `${n} мастера рядом`;
  return `${n} мастеров рядом`;
}

export function formatMastersCountLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 1) return '1 мастер';
  if (n >= 2 && n <= 4) return `${n} мастера`;
  return `${n} мастеров`;
}

/** Подпись доступности для карточки услуги в каталоге. */
export function formatServiceAvailabilityLabel(
  hasToday: boolean,
  nearestSlotIso: string | null | undefined,
): string {
  if (hasToday) return 'есть окна сегодня';
  const slot = formatNearestSlotLabel(nearestSlotIso);
  if (!slot) return 'уточните время';
  if (slot.startsWith('Завтра')) return 'ближайшее окно завтра';
  if (slot.startsWith('Сегодня')) return 'есть окна сегодня';
  return `ближайшее окно ${slot.replace(/^./, (c) => c.toLowerCase())}`;
}

/** Подпись времени для розовой плашки карточки мастера: «сегодня в 16:00». */
export function formatSlotCardSubline(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (isSlotToday(iso)) return `сегодня в ${time}`;
  const tomorrow = addDays(new Date(), 1);
  if (isSameCalendarDay(d, tomorrow)) return `завтра в ${time}`;
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${day} в ${time}`;
}

export function masterLocationShortLine(listing: ServiceListingRecord): string {
  const city = listing.location.city?.trim() || 'Минск';
  const district = masterDistrictLabel(listing);
  if (district && district !== city && district !== LOCATION_EMPTY_SENTINEL) {
    const short = district.length > 28 ? `${district.slice(0, 27)}…` : district;
    return `${city}, ${short}`;
  }
  return city;
}

export function masterDistrictLabel(listing: ServiceListingRecord): string | null {
  const street = listing.location.street?.trim();
  if (street && street !== LOCATION_EMPTY_SENTINEL) return street;
  const city = listing.location.city?.trim();
  return city || null;
}

/** Подпись «N просмотров за неделю» для карточки услуги. */
export function formatWeeklyViewsLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = 'просмотров';
  if (mod10 === 1 && mod100 !== 11) word = 'просмотр';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'просмотра';

  const display =
    n >= 10_000
      ? `${Math.round(n / 1000)} тыс.`
      : n >= 1000
        ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')} тыс.`
        : n.toLocaleString('ru-RU');

  return `${display} ${word} / нед`;
}

/** Компактно для плитки маркетплейса. */
export function formatReviewsCountCompact(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return 'новый';
  if (n >= 10_000) return `(${Math.round(n / 1000)}K+)`;
  if (n >= 1000) {
    const k = n / 1000;
    return `(${k.toFixed(1).replace(/\.0$/, '')}K+)`;
  }
  return `(${n.toLocaleString('ru-RU')})`;
}
