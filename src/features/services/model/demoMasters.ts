/**
 * TODO (Supabase): заменить на запросы к API (masters, services, slots, reviews).
 * Типы — контракт для UI и будущих мапперов с БД.
 */

import { addDays, isSameCalendarDay } from '../../booking/lib/calendar';
import type { MasterDraft } from '../../profile/lib/demoMasterStorage';
import { getStoredMasterDraft } from '../../profile/lib/demoMasterStorage';
import { defaultMasterAvatarUrl } from '../../master/model/masterDraftStorage';
import type { MasterLocation } from '../../profile/model/masterLocation';
import { DEMO_MASTER_LOCATIONS } from './demoMasterLocations';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../catalog/categoryWorkPhotos';

export type ServiceListingRecord = {
  id: string;
  masterId: string;
  masterName: string;
  category: string;
  serviceName: string;
  rating: number;
  /** TODO (Supabase): агрегат из таблицы reviews. */
  reviewsCount: number;
  location: MasterLocation;
  priceFrom: number;
  photoUrl: string;
  /** С бэка: id основной услуги для ссылки на запись. */
  primaryServiceId?: string;
  /** С бэка: id ближайшего свободного слота (для `slot` в ссылке на /zapis). */
  nextSlotId?: string | null;
  /** С бэка: ближайшее свободное окно (ISO) для бейджа на /services. */
  nextSlotStartsAt?: string | null;
  /** Превью работ для карточки в каталоге (если API отдаёт). */
  portfolioPreview?: string[];
  /** Всего работ в портфолио (для «+N работ»). */
  portfolioTotal?: number;
};

/** Услуга мастера (каталог). TODO: маппинг с таблицы services. */
export type DemoMasterService = {
  id: string;
  title: string;
  duration: number;
  price: number;
  description: string;
  priceType?: 'fixed' | 'from';
};

/** Один временной слот. TODO: маппинг с availability / bookings. */
export type DemoTimeSlot = {
  slotId: string;
  timeLabel: string;
};

/** Слоты за календарный день. TODO: группировка по дате с бэкенда. */
export type DemoAvailableDay = {
  id: string;
  dateLabel: string;
  /** ISO YYYY-MM-DD для сортировки и slot_id. */
  date: string;
  times: DemoTimeSlot[];
};

/** TODO (Supabase): строка из таблицы reviews (author_id, created_at, rating, body). */
export type DemoReview = {
  id: string;
  author: string;
  rating: number;
  /** Отображаемая дата: относительная строка или дата. */
  date: string;
  text: string;
};

export type DemoMasterProfile = {
  masterId: string;
  masterName: string;
  category: string;
  /** Slug категории (`manicure`, …) — фото услуг и фильтры. */
  categoryCode?: string;
  rating: number;
  reviewsCount: number;
  location: MasterLocation;
  photoUrl: string;
  bio: string;
  /** Телефон для связи (из черновика мастера). */
  phone?: string;
  /** Telegram и др. */
  contact?: string;
  services: DemoMasterService[];
  /**
   * Слоты по id услуги. Пустой массив в значении — нет окон на эту услугу.
   * TODO (Supabase): join services + availability по master_id / service_id.
   */
  availableSlotsByServiceId: Record<string, DemoAvailableDay[]>;
  reviews: DemoReview[];
};

/** Склонение «N отзыв(ов)» для UI. */
export function formatReviewsCountLabel(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} отзыва`;
  return `${n} отзывов`;
}

function demoReviewsFor(masterKey: string): DemoReview[] {
  const rows: Omit<DemoReview, 'id'>[] = [
    {
      author: 'Алина',
      rating: 5.0,
      date: '2 дня назад',
      text: 'Очень аккуратно, быстро и красиво. Обязательно вернусь.',
    },
    {
      author: 'Мария',
      rating: 4.9,
      date: 'неделю назад',
      text: 'Удобная запись, мастер сразу подтвердила время.',
    },
    {
      author: 'Екатерина',
      rating: 5.0,
      date: '12 мая 2026',
      text: 'Приятная атмосфера и отличный результат.',
    },
    {
      author: 'Даша',
      rating: 4.8,
      date: '3 дня назад',
      text: 'Все понравилось, особенно напоминание перед записью.',
    },
  ];
  return rows.map((r, i) => ({ ...r, id: `rev-${masterKey}-${i}` }));
}

function slotDays(
  masterKey: string,
  serviceId: string,
  rows: { dateLabel: string; date: string; times: string[] }[],
): DemoAvailableDay[] {
  return rows.map((row, di) => ({
    id: `day-${masterKey}-${serviceId}-${di}`,
    dateLabel: row.dateLabel,
    date: row.date,
    times: row.times.map((t, ti) => ({
      slotId: `slot-${masterKey}-${serviceId}-${row.date}-${ti}-${t.replace(':', '')}`,
      timeLabel: t,
    })),
  }));
}

/** Сколько дней показывать в горизонтальной полосе записи (демо). */
export const BOOKING_CALENDAR_DAY_COUNT = 14;

type DemoSlotVariant = 'standard' | 'morning' | 'afternoon' | 'empty';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Подпись на pill: Сегодня / Завтра / «Ср, 14 мая». */
export function formatBookingPillLabel(day: Date, todayStart: Date): string {
  const day0 = startOfLocalDay(day);
  const t0 = startOfLocalDay(todayStart);
  if (isSameCalendarDay(day0, t0)) return 'Сегодня';
  const tomorrow = addDays(t0, 1);
  if (isSameCalendarDay(day0, tomorrow)) return 'Завтра';
  const raw = day0
    .toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
    .trim();
  if (!raw) return toISODateLocal(day0);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const SLOT_ROTATIONS: Record<Exclude<DemoSlotVariant, 'empty'>, string[][]> = {
  standard: [
    ['11:00', '15:30', '18:00'],
    ['10:00', '12:30', '17:00'],
    ['09:30', '14:00', '19:00'],
    ['12:00', '14:30', '17:00'],
    ['10:00', '13:30', '16:00'],
    ['11:30', '15:00', '18:30'],
  ],
  morning: [
    ['08:00', '09:30', '11:00'],
    ['08:00', '10:00', '12:00'],
    ['09:00', '11:30'],
    ['08:30', '10:30'],
    ['07:30', '09:00', '11:00'],
  ],
  afternoon: [
    ['14:00', '16:00', '18:30'],
    ['15:00', '17:30'],
    ['12:00', '15:00', '19:00'],
    ['13:00', '16:30', '18:00'],
    ['14:30', '17:00', '19:30'],
  ],
};

function inferDemoSlotVariant(seed: DemoAvailableDay[]): DemoSlotVariant {
  if (!seed.length) return 'empty';
  const labels = seed[0]?.times.map((t) => t.timeLabel) ?? [];
  if (labels.includes('08:00')) return 'morning';
  if (labels[0] === '14:00' || labels.includes('18:30')) return 'afternoon';
  return 'standard';
}

/**
 * 14 календарных дней от anchor с разными наборами времён по дням (демо).
 * Один день без окон — чтобы UI показывал пустое состояние.
 */
function buildDemoBookingCalendarDays(
  masterId: string,
  serviceId: string,
  variant: Exclude<DemoSlotVariant, 'empty'>,
  anchor: Date,
  count: number,
): DemoAvailableDay[] {
  const rotations = SLOT_ROTATIONS[variant];
  const anchor0 = startOfLocalDay(anchor);
  const out: DemoAvailableDay[] = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(anchor0, i);
    const iso = toISODateLocal(d);
    let timeStrings = [...rotations[i % rotations.length]];
    if (variant === 'standard' && i === 10) timeStrings = [];
    const times: DemoTimeSlot[] = timeStrings.map((t, ti) => ({
      slotId: `slot-${masterId}-${serviceId}-${iso}-${ti}-${t.replace(':', '')}`,
      timeLabel: t,
    }));
    out.push({
      id: `day-${masterId}-${serviceId}-${iso}`,
      dateLabel: formatBookingPillLabel(d, anchor0),
      date: iso,
      times,
    });
  }
  return out;
}

/** Три стандартных дня с разным набором времени (демо). */
function slotsStandard(masterKey: string, serviceId: string): DemoAvailableDay[] {
  return slotDays(masterKey, serviceId, [
    { dateLabel: 'Сегодня', date: '2026-05-12', times: ['12:00', '14:30', '17:00'] },
    { dateLabel: 'Завтра', date: '2026-05-13', times: ['10:00', '13:30', '16:00'] },
    { dateLabel: 'Ср, 14 мая', date: '2026-05-14', times: ['11:00', '15:30', '18:00'] },
  ]);
}

function slotsMorning(masterKey: string, serviceId: string): DemoAvailableDay[] {
  return slotDays(masterKey, serviceId, [
    { dateLabel: 'Сегодня', date: '2026-05-12', times: ['08:00', '09:30', '11:00'] },
    { dateLabel: 'Завтра', date: '2026-05-13', times: ['08:00', '10:00', '12:00'] },
    { dateLabel: 'Сб, 16 мая', date: '2026-05-16', times: ['09:00', '11:30'] },
  ]);
}

function slotsAfternoon(masterKey: string, serviceId: string): DemoAvailableDay[] {
  return slotDays(masterKey, serviceId, [
    { dateLabel: 'Сегодня', date: '2026-05-12', times: ['14:00', '16:00', '18:30'] },
    { dateLabel: 'Завтра', date: '2026-05-13', times: ['15:00', '17:30'] },
    { dateLabel: 'Вс, 17 мая', date: '2026-05-17', times: ['12:00', '15:00', '19:00'] },
  ]);
}

function mapSlotsForServices(
  masterKey: string,
  serviceIds: string[],
  variant: 'standard' | 'morning' | 'afternoon' | 'empty',
): Record<string, DemoAvailableDay[]> {
  const pick = (sid: string) => {
    if (variant === 'empty') return [];
    if (variant === 'morning') return slotsMorning(masterKey, sid);
    if (variant === 'afternoon') return slotsAfternoon(masterKey, sid);
    return slotsStandard(masterKey, sid);
  };
  return Object.fromEntries(serviceIds.map((id) => [id, pick(id)]));
}

const MASTERS: DemoMasterProfile[] = [
  {
    masterId: 'demo-anna-smirnova',
    masterName: 'Анна Смирнова',
    category: 'Маникюр',
    rating: 4.9,
    location: DEMO_MASTER_LOCATIONS['demo-anna-smirnova'],
    photoUrl:
      'https://ui-avatars.com/api/?name=Anna+Smirnova&background=F1EFEF&color=525252&size=256',
    bio: 'Мастер маникюра с опытом более 7 лет. Работаю с покрытием и укреплением, подберу форму под ваш образ жизни.',
    phone: '+375 29 123-45-67',
    contact: '@anna_nails_slotty',
    services: [
      {
        id: 'svc-anna-manicure',
        title: 'Маникюр с покрытием',
        duration: 90,
        price: 45,
        description: 'Аккуратный маникюр с однотонным покрытием.',
      },
      {
        id: 'svc-anna-pedi',
        title: 'Педикюр',
        duration: 75,
        price: 55,
        description: 'Смягчение, обработка стоп и аккуратное покрытие.',
      },
      {
        id: 'svc-anna-extensions',
        title: 'Наращивание ногтей',
        duration: 120,
        price: 70,
        description: 'Наращивание или коррекция с выравниванием и покрытием.',
      },
    ],
    availableSlotsByServiceId: {
      ...mapSlotsForServices('anna', ['svc-anna-manicure', 'svc-anna-pedi'], 'standard'),
      'svc-anna-extensions': slotsAfternoon('anna', 'svc-anna-extensions'),
    },
    reviewsCount: 128,
    reviews: demoReviewsFor('anna'),
  },
  {
    masterId: 'demo-igor-volkov',
    masterName: 'Игорь Волков',
    category: 'Барберы',
    rating: 4.8,
    location: DEMO_MASTER_LOCATIONS['demo-igor-volkov'],
    photoUrl:
      'https://ui-avatars.com/api/?name=Igor+Volkov&background=F1EFEF&color=525252&size=256',
    bio: 'Барбер-стилист. Аккуратные линии, комфортная атмосфера и честные рекомендации по уходу.',
    phone: '+375 44 987-65-43',
    contact: 'https://t.me/igor_barber_slotty',
    services: [
      {
        id: 'svc-igor-cut',
        title: 'Мужская стрижка',
        duration: 45,
        price: 35,
        description: 'Стрижка машинкой и ножницами, укладка по желанию.',
      },
      {
        id: 'svc-igor-combo',
        title: 'Стрижка + борода',
        duration: 75,
        price: 55,
        description: 'Комплекс: стрижка и аккуратное оформление бороды.',
      },
      {
        id: 'svc-igor-beard',
        title: 'Оформление бороды',
        duration: 30,
        price: 25,
        description: 'Контур, длина и уход без полной стрижки.',
      },
    ],
    availableSlotsByServiceId: mapSlotsForServices(
      'igor',
      ['svc-igor-cut', 'svc-igor-combo', 'svc-igor-beard'],
      'morning',
    ),
    reviewsCount: 94,
    reviews: demoReviewsFor('igor'),
  },
  {
    masterId: 'demo-maria-lebedeva',
    masterName: 'Мария Лебедева',
    category: 'Брови и ресницы',
    rating: 4.9,
    location: DEMO_MASTER_LOCATIONS['demo-maria-lebedeva'],
    photoUrl:
      'https://ui-avatars.com/api/?name=Maria+Lebedeva&background=F1EFEF&color=525252&size=256',
    bio: 'Бровист и лешмейкер. Мягкие формы, натуральные оттенки, бережная работа с кожей.',
    phone: '+375 29 555-12-03',
    contact: 'Запись в Telegram: @maria_brows_slotty',
    services: [
      {
        id: 'svc-maria-brows',
        title: 'Коррекция бровей',
        duration: 40,
        price: 30,
        description: 'Форма и аккуратная коррекция под тип лица.',
      },
      {
        id: 'svc-maria-tint',
        title: 'Окрашивание бровей',
        duration: 45,
        price: 35,
        description: 'Стойкий краситель и натуральный оттенок.',
      },
      {
        id: 'svc-maria-lami',
        title: 'Ламинирование ресниц',
        duration: 75,
        price: 60,
        description: 'Объём и изгиб без наращивания.',
      },
    ],
    availableSlotsByServiceId: mapSlotsForServices(
      'maria',
      ['svc-maria-brows', 'svc-maria-tint', 'svc-maria-lami'],
      'standard',
    ),
    reviewsCount: 156,
    reviews: demoReviewsFor('maria'),
  },
  {
    masterId: 'demo-bodyform',
    masterName: 'BodyForm',
    category: 'Фитнес',
    rating: 4.7,
    location: DEMO_MASTER_LOCATIONS['demo-bodyform'],
    photoUrl:
      'https://ui-avatars.com/api/?name=BodyForm&background=F1EFEF&color=525252&size=256',
    bio: 'Персональные тренировки и восстановление. План под ваш уровень и цели — от первых шагов до уверенной формы.',
    services: [
      {
        id: 'svc-bodyform-pt',
        title: 'Персональная тренировка',
        duration: 60,
        price: 60,
        description: 'Индивидуальный план и контроль техники.',
      },
      {
        id: 'svc-bodyform-stretch',
        title: 'Растяжка',
        duration: 45,
        price: 45,
        description: 'Мобильность и восстановление после нагрузок.',
      },
      {
        id: 'svc-bodyform-func',
        title: 'Функциональная тренировка',
        duration: 60,
        price: 55,
        description: 'Силовой блок и работа с весом тела.',
      },
    ],
    availableSlotsByServiceId: mapSlotsForServices(
      'bodyform',
      ['svc-bodyform-pt', 'svc-bodyform-stretch', 'svc-bodyform-func'],
      'morning',
    ),
    reviewsCount: 0,
    reviews: [],
  },
  {
    masterId: 'demo-massage-pro',
    masterName: 'Massage Pro',
    category: 'Массаж',
    rating: 4.8,
    location: DEMO_MASTER_LOCATIONS['demo-massage-pro'],
    photoUrl:
      'https://ui-avatars.com/api/?name=Massage+Pro&background=F1EFEF&color=525252&size=256',
    bio: 'Классический и спортивный массаж. Помогу снять напряжение после работы или подготовиться к нагрузкам.',
    services: [
      {
        id: 'svc-massage-classic',
        title: 'Классический массаж',
        duration: 60,
        price: 70,
        description: 'Общий расслабляющий массаж всего тела.',
      },
      {
        id: 'svc-massage-sport',
        title: 'Спортивный массаж',
        duration: 60,
        price: 80,
        description: 'Глубокая проработка мышц после тренировок.',
      },
      {
        id: 'svc-massage-relax',
        title: 'Релакс массаж',
        duration: 90,
        price: 95,
        description: 'Медленный ритм и акцент на шее и спине.',
      },
    ],
    availableSlotsByServiceId: {
      ...mapSlotsForServices('massage', ['svc-massage-classic', 'svc-massage-sport'], 'afternoon'),
      'svc-massage-relax': [],
    },
    reviewsCount: 72,
    reviews: demoReviewsFor('massage'),
  },
  {
    masterId: 'demo-tattoo-room',
    masterName: 'Tattoo Room',
    category: 'Тату',
    rating: 4.9,
    location: DEMO_MASTER_LOCATIONS['demo-tattoo-room'],
    photoUrl:
      'https://ui-avatars.com/api/?name=Tattoo+Room&background=F1EFEF&color=525252&size=256',
    bio: 'Мини-тату и эскизы в спокойной студии. Консультация, стерильность и внимание к деталям.',
    services: [
      {
        id: 'svc-tattoo-mini',
        title: 'Мини-тату',
        duration: 90,
        price: 80,
        description: 'Небольшой эскиз за один сеанс.',
      },
      {
        id: 'svc-tattoo-consult',
        title: 'Консультация',
        duration: 30,
        price: 0,
        description: 'Обсудим идею, размер и уход после сеанса.',
      },
      {
        id: 'svc-tattoo-sketch',
        title: 'Эскиз',
        duration: 60,
        price: 50,
        description: 'Прорисовка эскиза под будущую работу.',
      },
    ],
    availableSlotsByServiceId: mapSlotsForServices(
      'tattoo',
      ['svc-tattoo-mini', 'svc-tattoo-consult', 'svc-tattoo-sketch'],
      'standard',
    ),
    reviewsCount: 41,
    reviews: demoReviewsFor('tattoo'),
  },
];

/** Встроенные демо-профили (каталог слотов, рейтинги, услуги). */
export const DEMO_MASTER_PROFILES: readonly DemoMasterProfile[] = MASTERS;

/** Карточки ленты поиска: по одной записи на мастера (главная услуга). */
export const DEMO_SERVICE_LISTINGS: ServiceListingRecord[] = MASTERS.map((m) => {
  const primary = m.services[0];
  const nextSlot = new Date();
  nextSlot.setHours(16, 0, 0, 0);
  if (nextSlot.getTime() < Date.now()) nextSlot.setDate(nextSlot.getDate() + 1);
  const categoryPhoto = getCategoryWorkPhotoUrl(resolveCategoryWorkCode(m.category));
  return {
    id: `listing-${m.masterId}`,
    masterId: m.masterId,
    masterName: m.masterName,
    category: m.category,
    serviceName: primary.title,
    rating: m.rating,
    reviewsCount: m.reviewsCount,
    location: m.location,
    priceFrom: primary.price,
    photoUrl: m.photoUrl,
    primaryServiceId: primary.id,
    nextSlotStartsAt: nextSlot.toISOString(),
    nextSlotId: `demo-slot-${m.masterId}`,
    portfolioPreview: [categoryPhoto],
    portfolioTotal: 27,
  };
});

function draftToDemoProfile(draft: MasterDraft): DemoMasterProfile {
  const masterId = draft.masterId ?? 'demo_master_local';
  return {
    masterId,
    masterName: draft.name.trim() || 'Мастер',
    category: draft.category,
    rating: 4.9,
    reviewsCount: 4,
    location: draft.location,
    photoUrl: (draft.photoUrl && draft.photoUrl.trim()) || defaultMasterAvatarUrl(draft.name),
    bio: draft.description.trim() || 'Профиль мастера SLOTTY.',
    phone: draft.phone?.trim() || undefined,
    contact: draft.contact?.trim() || undefined,
    services: draft.services.map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.durationMin,
      price: s.priceByn,
      description: s.description?.trim() ?? '',
    })),
    availableSlotsByServiceId: Object.fromEntries(draft.services.map((s) => [s.id, [] as DemoAvailableDay[]])),
    reviews: [],
  };
}

export function getDemoMasterProfile(masterId: string): DemoMasterProfile | undefined {
  const builtIn = MASTERS.find((m) => m.masterId === masterId);
  if (builtIn) return builtIn;
  const draft = getStoredMasterDraft();
  if (!draft) return undefined;
  const id = draft.masterId ?? 'demo_master_local';
  if (masterId === id) return draftToDemoProfile(draft);
  return undefined;
}

/**
 * Слоты по услуге на ближайшие `BOOKING_CALENDAR_DAY_COUNT` календарных дней (демо).
 * Вариант сетки (утро / день / стандарт) выводится из «seed» в `availableSlotsByServiceId`.
 * TODO (Supabase): availability API по реальным датам.
 */
export function getDemoSlotDaysForService(
  masterId: string,
  serviceId: string,
  referenceDate: Date = new Date(),
): DemoAvailableDay[] {
  const m = getDemoMasterProfile(masterId);
  if (!m) return [];
  const seed = m.availableSlotsByServiceId[serviceId] ?? [];
  if (!seed.length) return [];
  const variant = inferDemoSlotVariant(seed);
  if (variant === 'empty') return [];
  const anchor = startOfLocalDay(referenceDate);
  return buildDemoBookingCalendarDays(masterId, serviceId, variant, anchor, BOOKING_CALENDAR_DAY_COUNT);
}

/** Услуга по query или первая в каталоге. */
export function resolveDemoServiceForBooking(
  master: DemoMasterProfile,
  serviceIdFromUrl: string | null,
): DemoMasterService | undefined {
  if (!master.services.length) return undefined;
  if (serviceIdFromUrl) {
    return master.services.find((s) => s.id === serviceIdFromUrl) ?? master.services[0];
  }
  return master.services[0];
}

/** Первый доступный слот (ближайший в порядке дней). */
export function pickFirstDemoSlot(days: DemoAvailableDay[]): { day: DemoAvailableDay; slot: DemoTimeSlot } | null {
  for (const day of days) {
    const slot = day.times[0];
    if (slot) return { day, slot };
  }
  return null;
}
