import { normalizeCategoryCode } from '../features/catalog/serviceCategoryLabels';

/** Главный хаб (лендинг, поиск, лента). */
export const HUB_PATH = '/book';

export const LOGIN_PATH = '/login';
export const MASTER_LOGIN_PATH = '/master/login';
export const VERIFY_EMAIL_PATH = '/auth/verify-email';
export const FORGOT_PASSWORD_PATH = '/auth/forgot-password';
export const RESET_PASSWORD_PATH = '/auth/reset-password';
export const GOOGLE_OAUTH_DONE_PATH = '/auth/google/done';
export const GOOGLE_LINK_PATH = '/auth/link-google';

/** /login с возвратом после входа (?from=/текущая-страница). */
export function getLoginPath(fromPath?: string): string {
  if (!fromPath || fromPath === LOGIN_PATH || fromPath.startsWith(`${LOGIN_PATH}?`)) {
    return LOGIN_PATH;
  }
  return `${LOGIN_PATH}?${new URLSearchParams({ from: fromPath }).toString()}`;
}

/** Поиск услуг для клиента. */
export const SERVICES_PATH = '/services';

/** Каталог мастеров для клиента. */
export const MASTERS_PATH = '/masters';

export type MastersCatalogUrlParams = {
  /** Только мастера со свободными окнами. */
  slots?: boolean;
  sort?: 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'reviews' | 'soonest';
  verified?: boolean;
  promo?: boolean;
  /** Минимум отзывов: 5 | 20 | 50. */
  reviews?: '5' | '20' | '50';
  category?: string;
  /** Сортировка по рейтингу + фильтр от 4.5. */
  rating?: boolean;
};

export function getMastersCatalogPath(opts?: MastersCatalogUrlParams): string {
  if (!opts) return MASTERS_PATH;
  const q = new URLSearchParams();
  if (opts.slots) q.set('slots', '1');
  if (opts.sort && opts.sort !== 'recommended') q.set('sort', opts.sort);
  if (opts.verified) q.set('verified', '1');
  if (opts.promo) q.set('promo', '1');
  if (opts.reviews) q.set('reviews', opts.reviews);
  if (opts.category) q.set('category', opts.category);
  if (opts.rating) q.set('rating', '1');
  const s = q.toString();
  return s ? `${MASTERS_PATH}?${s}` : MASTERS_PATH;
}

export function getServiceCategoryPath(categoryCode: string): string {
  return `${SERVICES_PATH}/category/${encodeURIComponent(normalizeCategoryCode(categoryCode))}`;
}

/** Мой профиль: записи, избранное, настройки (вкладки через query). */
export const PROFILE_PATH = '/profile';

/** Уведомления клиента. */
export const PROFILE_NOTIFICATIONS_PATH = `${PROFILE_PATH}/notifications`;

/** Настройки клиента. */
export const PROFILE_SETTINGS_PATH = `${PROFILE_PATH}/settings`;
export const PROFILE_SETTINGS_LOGIN_METHODS_PATH = `${PROFILE_SETTINGS_PATH}/login-methods`;
export const PROFILE_SETTINGS_SUPPORT_PATH = `${PROFILE_SETTINGS_PATH}/support`;
export const PROFILE_SETTINGS_DOCUMENTS_PATH = `${PROFILE_SETTINGS_PATH}/documents`;

export function getProfileSettingsDocumentPath(docId: string): string {
  return `${PROFILE_SETTINGS_DOCUMENTS_PATH}/${encodeURIComponent(docId)}`;
}

/** Экран записи: дата и слоты. */
export const BOOKING_PATH = '/zapis';

/** Онбординг мастера (демо, до кабинета). */
export const BECOME_MASTER_PATH = '/become-master';

/** Кабинет мастера (после онбординга). */
export const ADMIN_PATH = '/admin';

/** Разделы кабинета (отдельные страницы). */
export const ADMIN_SERVICES_PATH = '/admin/services';
export const ADMIN_SCHEDULE_PATH = '/admin/schedule';
export const ADMIN_APPOINTMENTS_PATH = '/admin/appointments';
export const ADMIN_OVERVIEW_PATH = '/admin/overview';
export const ADMIN_BILLING_PATH = '/admin/billing';
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications';
export const ADMIN_SETTINGS_PATH = '/admin/settings';
export const ADMIN_SETTINGS_LOGIN_METHODS_PATH = '/admin/settings/login-methods';
export const ADMIN_SETTINGS_SUPPORT_PATH = '/admin/settings/support';
export const ADMIN_SETTINGS_DOCUMENTS_PATH = '/admin/settings/documents';
/** Редирект со старого URL. */
export const ADMIN_LOGIN_METHODS_PATH = ADMIN_SETTINGS_LOGIN_METHODS_PATH;
export const ADMIN_PROFILE_COMPLETION_PATH = '/admin/profile/completion';

/** Политика обработки персональных данных (страница). */
export const LEGAL_PRIVACY_PATH = '/legal/privacy';

/** Согласие на обработку персональных данных (страница). */
export const LEGAL_PD_CONSENT_PATH = '/legal/consent-pd';

/** Пользовательское соглашение (страница). */
export const LEGAL_TERMS_PATH = '/legal/terms';

/** Шаблон маршрута профиля мастера (для документации / Route). */
export const MASTER_PATH = '/master/:id';

export function getMasterPath(masterId: string): string {
  return `/master/${encodeURIComponent(masterId)}`;
}

/** Ссылка на профиль; `tab`: appointments | favorites | settings. */
export function getProfilePath(tab?: 'appointments' | 'favorites' | 'settings'): string {
  if (tab === 'settings') return PROFILE_SETTINGS_PATH;
  if (!tab) return PROFILE_PATH;
  return `${PROFILE_PATH}?${new URLSearchParams({ tab }).toString()}`;
}

/**
 * Ссылка на экран записи с query.
 * TODO (Supabase): валидировать master_id / service_id / slot с бэкенда.
 * TODO: при сохранении записи в БД — слот как отдельная сущность, не только query.
 */
export function getBookingPath(
  masterId: string,
  serviceId?: string | null,
  slotId?: string | null,
  opts?: { from?: 'services' },
): string {
  const q = new URLSearchParams({ master_id: masterId });
  if (serviceId) q.set('service_id', serviceId);
  if (slotId) q.set('slot', slotId);
  if (opts?.from === 'services') q.set('from', 'services');
  return `${BOOKING_PATH}?${q.toString()}`;
}
