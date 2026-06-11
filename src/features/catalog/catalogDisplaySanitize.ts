/** UI-санитизация: скрываем технические/test данные в клиентском каталоге. */

import { normalizeCategoryCode } from './serviceCategoryLabels';

const TECHNICAL_NAME_RE =
  /^(day\s*\d+|e2e[_\-\s]|test[_\-\s]|demo[_\-\s]|horizon|playwright|batch|fixture|staging|qa[_\-\s]|mock)/i;

const TECHNICAL_NAME_FRAGMENT_RE =
  /\b(e2e|playwright|batch|batch\s*test|fixture|staging|qa|mock|test\s*master|test\s*service|day\s*\d+\s*master)\b/i;

const TECHNICAL_SERVICE_FRAGMENT_RE =
  /\b(batch\s*test|test\s*service|e2e|playwright|fixture|staging|qa|mock|тестовая\s*услуг|демо\s*услуг)\b/i;

const SERVICE_TITLE_SUFFIX_RE =
  /\s+(копия|copy|тест|test|демо|demo|черновик|draft)(?:\s*\d*)?\s*$/iu;

const TECHNICAL_ADDRESS_RE =
  /\b(тестовая|test\s*st|e2e|playwright|fixture|demo\s*addr|staging|ул\.?\s*test|test\s*street)\b/i;

export const FALLBACK_MASTER_NAME = 'Проверенный мастер';
export const FALLBACK_MASTER_NAME_SHORT = 'Мастер Slotty';

export type CatalogSanitizeContext = {
  categoryCode?: string | null;
  masterId?: string | null;
};

const CATEGORY_SERVICE_FALLBACKS: Record<string, readonly string[]> = {
  manicure: [
    'Маникюр с покрытием',
    'Укрепление ногтей',
    'Классический маникюр',
    'Маникюр и дизайн',
  ],
  barbers: ['Мужская стрижка', 'Стрижка и укладка', 'Бритьё и стайлинг', 'Моделирование бороды'],
  'brows-lashes': [
    'Коррекция бровей',
    'Ламинирование ресниц',
    'Оформление бровей',
    'Наращивание ресниц',
  ],
  massage: ['Расслабляющий массаж', 'Массаж спины и шеи', 'Антицеллюлитный массаж', 'Спортивный массаж'],
  fitness: ['Персональная тренировка', 'Растяжка и мобильность', 'Силовая тренировка'],
  tattoo: ['Мини-тату', 'Эскиз и консультация', 'Татуировка под ключ'],
};

const DEFAULT_SERVICE_FALLBACKS = [
  'Популярная услуга',
  'Базовая процедура',
  'Индивидуальная запись',
  'Консультация мастера',
] as const;

const CATEGORY_MASTER_FALLBACKS: Record<string, readonly string[]> = {
  manicure: ['Анна', 'Марина', 'Ксения', 'Виктория', 'Алина', 'Дарья'],
  barbers: ['Дмитрий', 'Артём', 'Максим', 'Игорь', 'Никита', 'Павел'],
  'brows-lashes': ['Елена', 'София', 'Полина', 'Вероника', 'Кристина', 'Юлия'],
  massage: ['Ольга', 'Наталья', 'Татьяна', 'Светлана', 'Ирина', 'Людмила'],
  fitness: ['Алексей', 'Роман', 'Кирилл', 'Егор', 'Владислав', 'Станислав'],
  tattoo: ['Михаил', 'Денис', 'Андрей', 'Сергей', 'Владимир', 'Глеб'],
};

const DEFAULT_MASTER_FALLBACKS = [
  'Анна',
  'Марина',
  'Дмитрий',
  'Елена',
  'Артём',
  'Ксения',
  'Максим',
  'Ольга',
] as const;

function stableIndex(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function catalogCategoryKey(categoryCode?: string | null): string {
  return normalizeCategoryCode(categoryCode ?? '');
}

function looksTechnicalName(raw: string): boolean {
  const n = raw.trim();
  if (!n) return true;
  if (TECHNICAL_NAME_RE.test(n)) return true;
  if (TECHNICAL_NAME_FRAGMENT_RE.test(n)) return true;
  if (/^master\s*\d+$/i.test(n)) return true;
  return false;
}

function looksTechnicalServiceTitle(raw: string): boolean {
  const n = raw.trim();
  if (!n) return true;
  if (TECHNICAL_NAME_RE.test(n)) return true;
  if (TECHNICAL_SERVICE_FRAGMENT_RE.test(n)) return true;
  if (TECHNICAL_NAME_FRAGMENT_RE.test(n)) return true;
  return false;
}

function stripServiceTitleSuffix(raw: string): string {
  let cleaned = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    const next = cleaned.replace(SERVICE_TITLE_SUFFIX_RE, '').trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}

function resolveCatalogServiceFallback(ctx?: CatalogSanitizeContext): string {
  const code = catalogCategoryKey(ctx?.categoryCode);
  const pool = CATEGORY_SERVICE_FALLBACKS[code] ?? DEFAULT_SERVICE_FALLBACKS;
  const seed = `${ctx?.masterId ?? ''}:${code}:service`;
  return pool[stableIndex(seed, pool.length)] ?? DEFAULT_SERVICE_FALLBACKS[0];
}

function resolveCatalogMasterFallback(ctx?: CatalogSanitizeContext): string {
  const code = catalogCategoryKey(ctx?.categoryCode);
  const pool = CATEGORY_MASTER_FALLBACKS[code] ?? DEFAULT_MASTER_FALLBACKS;
  const seed = `${ctx?.masterId ?? ''}:${code}:master`;
  return pool[stableIndex(seed, pool.length)] ?? DEFAULT_MASTER_FALLBACKS[0];
}

function looksTechnicalAddress(raw: string): boolean {
  const a = raw.trim();
  if (!a) return true;
  if (TECHNICAL_ADDRESS_RE.test(a)) return true;
  if (/,\s*1\s*$/.test(a) && /тест/i.test(a)) return true;
  return false;
}

/** Название услуги для карточки каталога. */
export function sanitizeServiceTitle(
  title: string | null | undefined,
  ctx?: CatalogSanitizeContext,
): string {
  const cleaned = stripServiceTitleSuffix(title ?? '');
  if (cleaned && !looksTechnicalServiceTitle(cleaned)) return cleaned;
  return resolveCatalogServiceFallback(ctx);
}

/** Имя мастера для карточки каталога. */
export function sanitizeDisplayName(
  name: string | null | undefined,
  ctx?: CatalogSanitizeContext,
): string {
  const raw = name?.trim() ?? '';
  if (!raw || looksTechnicalName(raw)) return resolveCatalogMasterFallback(ctx);
  return raw;
}

/** Короткий fallback для плитки. */
export function sanitizeDisplayNameShort(
  name: string | null | undefined,
  ctx?: CatalogSanitizeContext,
): string {
  const raw = name?.trim() ?? '';
  if (!raw || looksTechnicalName(raw)) {
    const full = resolveCatalogMasterFallback(ctx);
    return full.split(/\s+/)[0] ?? FALLBACK_MASTER_NAME_SHORT;
  }
  return raw;
}

/** Адрес / район для чипа на карточке. */
export function sanitizeLocationLabel(label: string | null | undefined): string | undefined {
  const raw = label?.trim() ?? '';
  if (!raw || looksTechnicalAddress(raw)) return undefined;
  return raw;
}

export type ServiceCardRatingDisplay = {
  showRating: boolean;
  ratingText: string | null;
  reviewsText: string;
  isNewMaster: boolean;
};

/** Рейтинг + отзывы для карточки услуги. */
export function formatServiceCardRatingDisplay(
  avgRating: number,
  totalReviews: number,
): ServiceCardRatingDisplay {
  const reviews = Math.max(0, Math.floor(totalReviews));
  const rating = Number.isFinite(avgRating) ? avgRating : 0;

  if (reviews <= 0 && rating <= 0) {
    return {
      showRating: false,
      ratingText: null,
      reviewsText: 'Новый мастер',
      isNewMaster: true,
    };
  }

  if (reviews <= 0) {
    return {
      showRating: rating > 0,
      ratingText: rating > 0 ? rating.toFixed(1) : null,
      reviewsText: rating > 0 ? 'Отзывов пока нет' : 'Новый мастер',
      isNewMaster: rating <= 0,
    };
  }

  const mod10 = reviews % 10;
  const mod100 = reviews % 100;
  let word = 'отзывов';
  if (mod10 === 1 && mod100 !== 11) word = 'отзыв';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'отзыва';

  return {
    showRating: rating > 0,
    ratingText: rating > 0 ? rating.toFixed(1) : null,
    reviewsText: `${reviews} ${word}`,
    isNewMaster: false,
  };
}
