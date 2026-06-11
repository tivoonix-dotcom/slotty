import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  FORGOT_PASSWORD_PATH,
  GOOGLE_LINK_PATH,
  GOOGLE_OAUTH_DONE_PATH,
  HUB_PATH,
  LEGAL_CONSENT_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_CROSS_BORDER_PATH,
  LEGAL_MASTER_TERMS_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_PUBLIC_OFFER_PATH,
  LEGAL_REFUND_PATH,
  LEGAL_TERMS_PATH,
  PAYMENT_SUCCESS_PATH,
  PAYMENT_FAIL_PATH,
  LOGIN_PATH,
  MASTER_LOGIN_PATH,
  MASTER_REGISTER_PATH,
  MASTER_START_PATH,
  PROFILE_PATH,
  RESET_PASSWORD_PATH,
  SERVICES_PATH,
  VERIFY_EMAIL_PATH,
} from '../../app/paths';
import { normalizeCategoryCode } from '../../features/catalog/serviceCategoryLabels';
import {
  SEO_DEFAULT_OG_IMAGE,
  SEO_DEFAULT_ROBOTS,
  SEO_NOINDEX_ROBOTS,
  SEO_SITE_NAME,
} from './seoSite';

export type SeoMeta = {
  title: string;
  description: string;
  robots: string;
  /** Path for canonical (e.g. `/book`). Omit when canonical should not be set. */
  canonicalPath?: string;
  ogImage?: string;
};

const DEFAULT_DESCRIPTION =
  'SLOTTY помогает клиентам найти мастера и записаться онлайн, а мастерам — управлять услугами, расписанием и заявками.';

const HUB_META: SeoMeta = {
  title: 'SLOTTY — онлайн-запись к мастерам в Минске',
  description:
    'Найдите мастера в Минске и запишитесь онлайн. Маникюр, барберы, брови и ресницы, массаж, фитнес и тату в SLOTTY.',
  robots: SEO_DEFAULT_ROBOTS,
  canonicalPath: HUB_PATH,
  ogImage: SEO_DEFAULT_OG_IMAGE,
};

const SERVICES_META: SeoMeta = {
  title: 'Услуги мастеров в Минске — запись онлайн | SLOTTY',
  description:
    'Выбирайте услуги мастеров в Минске, смотрите цены, свободное время и записывайтесь онлайн через SLOTTY.',
  robots: SEO_DEFAULT_ROBOTS,
  canonicalPath: SERVICES_PATH,
  ogImage: SEO_DEFAULT_OG_IMAGE,
};

const CATEGORY_META: Record<string, SeoMeta> = {
  manicure: {
    title: 'Маникюр в Минске — запись онлайн | SLOTTY',
    description:
      'Маникюр в Минске: мастера, цены, свободные окна и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/manicure`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  barbers: {
    title: 'Барберы в Минске — запись онлайн | SLOTTY',
    description:
      'Барберы в Минске: стрижки, борода, свободное время и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/barbers`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  'brows-lashes': {
    title: 'Брови и ресницы в Минске — запись онлайн | SLOTTY',
    description:
      'Брови и ресницы в Минске: мастера, цены, свободные окна и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/brows-lashes`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  massage: {
    title: 'Массаж в Минске — запись онлайн | SLOTTY',
    description:
      'Массаж в Минске: мастера, цены, свободные окна и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/massage`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  fitness: {
    title: 'Фитнес в Минске — запись онлайн | SLOTTY',
    description:
      'Фитнес-тренеры в Минске: услуги, расписание, свободные окна и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/fitness`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  tattoo: {
    title: 'Тату в Минске — запись онлайн | SLOTTY',
    description:
      'Тату-мастера в Минске: услуги, цены, свободные окна и онлайн-запись через SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: `${SERVICES_PATH}/category/tattoo`,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
};

const LEGAL_META: Record<string, SeoMeta> = {
  [LEGAL_PRIVACY_PATH]: {
    title: 'Политика персональных данных | SLOTTY',
    description:
      'Политика SLOTTY в отношении обработки персональных данных пользователей сервиса онлайн-записи.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_PRIVACY_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_TERMS_PATH]: {
    title: 'Пользовательское соглашение | SLOTTY',
    description: 'Пользовательское соглашение сервиса онлайн-записи SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_TERMS_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_CONSENT_PATH]: {
    title: 'Согласие на обработку персональных данных | SLOTTY',
    description: 'Согласие пользователя на обработку персональных данных в сервисе SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_CONSENT_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_CROSS_BORDER_PATH]: {
    title: 'Согласие на трансграничную передачу ПД | SLOTTY',
    description:
      'Согласие на трансграничную передачу персональных данных в сервисе SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_CROSS_BORDER_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_MASTER_TERMS_PATH]: {
    title: 'Условия для мастеров | SLOTTY',
    description: 'Условия использования сервиса SLOTTY для мастеров и специалистов.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_MASTER_TERMS_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_PAYMENT_PATH]: {
    title: 'Оплата и безопасность платежей | SLOTTY',
    description:
      'Планируемые способы оплаты SLOTTY, безопасность платежей и порядок оплаты после подключения провайдера.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_PAYMENT_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_REFUND_PATH]: {
    title: 'Возвраты | SLOTTY',
    description: 'Правила возврата и отмены оплаты в сервисе SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_REFUND_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [LEGAL_PUBLIC_OFFER_PATH]: {
    title: 'Публичная оферта | SLOTTY',
    description: 'Публичная оферта сервиса онлайн-записи SLOTTY.',
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: LEGAL_PUBLIC_OFFER_PATH,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  },
  [PAYMENT_SUCCESS_PATH]: {
    title: 'Оплата принята | SLOTTY',
    description: 'Страница возврата после оплаты. Финальный статус подтверждается платёжным провайдером.',
    robots: SEO_NOINDEX_ROBOTS,
    canonicalPath: PAYMENT_SUCCESS_PATH,
  },
  [PAYMENT_FAIL_PATH]: {
    title: 'Оплата не завершена | SLOTTY',
    description: 'Страница возврата при неуспешной оплате.',
    robots: SEO_NOINDEX_ROBOTS,
    canonicalPath: PAYMENT_FAIL_PATH,
  },
};

const NOINDEX_META: SeoMeta = {
  title: `${SEO_SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  robots: SEO_NOINDEX_ROBOTS,
};

const NOT_FOUND_META: SeoMeta = {
  title: 'Страница не найдена | SLOTTY',
  description: 'Запрошенная страница не найдена.',
  robots: SEO_NOINDEX_ROBOTS,
};

const MASTER_GENERIC_META: SeoMeta = {
  title: 'Мастер — онлайн-запись | SLOTTY',
  description: 'Профиль мастера в SLOTTY: услуги, цены, отзывы и онлайн-запись в Минске.',
  robots: SEO_DEFAULT_ROBOTS,
  ogImage: SEO_DEFAULT_OG_IMAGE,
};

const NOINDEX_PATH_PREFIXES = [
  '/auth/',
  `${PROFILE_PATH}/`,
  `${ADMIN_PATH}/`,
  '/platform-admin/',
] as const;

const NOINDEX_EXACT_PATHS = new Set([
  LOGIN_PATH,
  MASTER_LOGIN_PATH,
  MASTER_REGISTER_PATH,
  MASTER_START_PATH,
  VERIFY_EMAIL_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  GOOGLE_OAUTH_DONE_PATH,
  GOOGLE_LINK_PATH,
  PROFILE_PATH,
  ADMIN_PATH,
  '/platform-admin',
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  '/settings',
]);

function pathnameOnly(path: string): string {
  const q = path.indexOf('?');
  return q >= 0 ? path.slice(0, q) : path;
}

function isNoindexPath(pathname: string): boolean {
  const path = pathnameOnly(pathname);
  if (NOINDEX_EXACT_PATHS.has(path)) return true;
  if (path.startsWith(ADMIN_PATH)) return true;
  if (path.startsWith('/platform-admin')) return true;
  if (path.startsWith(PROFILE_PATH)) return true;
  if (path.startsWith('/auth/')) return true;
  return NOINDEX_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function matchServiceCategory(pathname: string): SeoMeta | null {
  const prefix = `${SERVICES_PATH}/category/`;
  if (!pathname.startsWith(prefix)) return null;
  const segment = pathname.slice(prefix.length).split('/')[0];
  if (!segment) return null;
  const code = normalizeCategoryCode(decodeURIComponent(segment));
  return CATEGORY_META[code] ?? null;
}

function matchMasterProfile(pathname: string): SeoMeta | null {
  if (!pathname.startsWith('/master/')) return null;
  const id = pathname.slice('/master/'.length).split('/')[0];
  if (!id) return null;
  return {
    ...MASTER_GENERIC_META,
    canonicalPath: `/master/${encodeURIComponent(decodeURIComponent(id))}`,
  };
}

function isKnownAppRoute(path: string): boolean {
  if (path === '/' || path === HUB_PATH) return true;
  if (path === SERVICES_PATH) return true;
  if (path === '/catalog') return true;
  if (path.startsWith(`${SERVICES_PATH}/category/`)) return true;
  if (path.startsWith('/master/')) return true;
  if (path.startsWith('/legal/')) return true;
  if (path === LEGAL_PD_CONSENT_PATH) return true;
  if (isNoindexPath(path)) return true;
  return false;
}

/** Route-based SEO meta (no visible UI text). */
export function resolveSeoMeta(pathname: string): SeoMeta {
  const path = pathnameOnly(pathname);

  if (!isKnownAppRoute(path)) return NOT_FOUND_META;

  if (isNoindexPath(path)) {
    return { ...NOINDEX_META, canonicalPath: undefined };
  }

  if (path === '/' || path === HUB_PATH) return HUB_META;
  if (path === SERVICES_PATH) return SERVICES_META;

  const category = matchServiceCategory(path);
  if (category) return category;

  const legal = LEGAL_META[path];
  if (legal) return legal;

  const master = matchMasterProfile(path);
  if (master) return master;

  return {
    title: `${SEO_SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    robots: SEO_DEFAULT_ROBOTS,
    canonicalPath: path === '/' ? HUB_PATH : path,
    ogImage: SEO_DEFAULT_OG_IMAGE,
  };
}

export function truncateMetaDescription(text: string, maxLen = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trim()}…`;
}
