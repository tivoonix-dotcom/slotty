/**
 * Типы и утилиты для записей клиента (данные приходят с GET /api/me/appointments).
 */

import type { MasterLocation } from '../../profile/model/masterLocation';

export type DemoAppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export type DemoAppointmentTab = 'upcoming' | 'past';

/** Центр и метка для встраиваемого виджета Яндекс.Карт (долгота, широта). */
export type DemoAppointmentYandexMap = {
  lon: number;
  lat: number;
  /** Масштаб карты, по умолчанию 16 */
  zoom?: number;
};

/** Строка записи для UI и PDF (источник — API). */
export type DemoAppointmentRecord = {
  id: string;
  masterId: string;
  masterName: string;
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  location: MasterLocation;
  addressShort: string;
  yandexMap?: DemoAppointmentYandexMap;
  price: number;
  status: DemoAppointmentStatus;
  type: DemoAppointmentTab;
  voucherNumber?: string | null;
};

/** URL встраиваемого виджета Яндекс.Карт для адреса записи. */
export function buildYandexMapWidgetUrl(
  row: Pick<DemoAppointmentRecord, 'addressShort' | 'yandexMap' | 'location'>,
): string {
  if (row.yandexMap) {
    const { lon, lat, zoom = 16 } = row.yandexMap;
    const p = new URLSearchParams();
    p.set('ll', `${lon},${lat}`);
    p.set('z', String(zoom));
    p.set('pt', `${lon},${lat},pm2rdm`);
    return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
  }
  const loc = row.location;
  if (loc.lat != null && loc.lng != null) {
    const p = new URLSearchParams();
    p.set('ll', `${loc.lng},${loc.lat}`);
    p.set('z', '16');
    p.set('pt', `${loc.lng},${loc.lat},pm2rdm`);
    return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
  }

  const p = new URLSearchParams();
  p.set('text', row.addressShort);
  p.set('z', '14');
  p.set('lang', 'ru_RU');
  return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
}

/**
 * Ссылка на полные Яндекс.Карты с маршрутом «от вас до точки приёма».
 * `rtext=~широта,долгота` — тильда означает старт от текущей геопозиции (в приложении/браузере).
 */
export function buildYandexMapsRouteUrl(
  row: Pick<DemoAppointmentRecord, 'addressShort' | 'yandexMap' | 'location'>,
): string {
  let lat: number | undefined;
  let lon: number | undefined;

  if (row.yandexMap) {
    lat = row.yandexMap.lat;
    lon = row.yandexMap.lon;
  } else {
    const loc = row.location;
    if (loc.lat != null && loc.lng != null) {
      lat = loc.lat;
      lon = loc.lng;
    }
  }

  if (lat != null && lon != null) {
    const p = new URLSearchParams();
    p.set('rtext', `~${lat},${lon}`);
    return `https://yandex.ru/maps/?${p.toString()}`;
  }

  const u = new URL('https://yandex.ru/maps/');
  u.searchParams.set('text', row.addressShort);
  return u.toString();
}
