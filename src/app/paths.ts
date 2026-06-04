import { normalizeCategoryCode } from '../features/catalog/serviceCategoryLabels';

/** Главный хаб (лендинг, поиск, лента). */
export const HUB_PATH = '/book';

export const LOGIN_PATH = '/login';
export const MASTER_LOGIN_PATH = '/master/login';
/** Вводная: что даёт SLOTTY мастеру (CTA «Стать мастером» без входа). */
export const MASTER_START_PATH = '/master/start';
export const MASTER_REGISTER_PATH = '/master/register';

/** /master/login с возвратом после входа. */
export function getMasterLoginPath(fromPath?: string): string {
  if (!fromPath || fromPath === MASTER_LOGIN_PATH || fromPath.startsWith(`${MASTER_LOGIN_PATH}?`)) {
    return MASTER_LOGIN_PATH;
  }
  return `${MASTER_LOGIN_PATH}?${new URLSearchParams({ from: fromPath }).toString()}`;
}

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
  /** Табы каталога: рядом / сегодня / топ рейтинг. */
  tab?: 'near' | 'today' | 'top';
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
  if (opts.tab === 'near') {
    q.set('tab', 'near');
    q.set('sort', 'soonest');
    q.set('slots', '1');
  } else if (opts.tab === 'today') {
    q.set('tab', 'today');
  } else if (opts.tab === 'top') {
    q.set('tab', 'top');
    q.set('sort', 'rating');
    q.set('rating', '1');
  }
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

export type ServicesCatalogUrlParams = {
  tab?: 'popular' | 'promo' | 'new';
  sort?: 'recommended' | 'soonest' | 'rating' | 'price_asc' | 'price_desc' | 'reviews';
};

export function getServicesCatalogPath(opts?: ServicesCatalogUrlParams): string {
  if (!opts) return SERVICES_PATH;
  const q = new URLSearchParams();
  if (opts.tab) q.set('tab', opts.tab);
  if (opts.sort && opts.sort !== 'recommended') q.set('sort', opts.sort);
  const s = q.toString();
  return s ? `${SERVICES_PATH}?${s}` : SERVICES_PATH;
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

/** Deep link: конкретная запись клиента (номер SL-…). */
export const CLIENT_APPOINTMENT_PATH = '/client/appointments/:bookingCode';

/** Deep link: конкретная запись в кабинете мастера. */
export const MASTER_APPOINTMENT_PATH = '/master/appointments/:bookingCode';

export function getClientAppointmentPath(bookingCode: string): string {
  return `/client/appointments/${encodeURIComponent(bookingCode.trim().toUpperCase())}`;
}

export function getMasterAppointmentPath(bookingCode: string): string {
  return `/master/appointments/${encodeURIComponent(bookingCode.trim().toUpperCase())}`;
}

/** Онбординг мастера (демо, до кабинета). */
export const BECOME_MASTER_PATH = '/become-master';

/** Регистрация мастера (CTA «Стать мастером» без сессии). */
export function getMasterRegisterPath(fromPath?: string): string {
  const target = fromPath ?? BECOME_MASTER_PATH;
  if (target === MASTER_REGISTER_PATH || target.startsWith(`${MASTER_REGISTER_PATH}?`)) {
    return MASTER_REGISTER_PATH;
  }
  return `${MASTER_REGISTER_PATH}?${new URLSearchParams({ from: target }).toString()}`;
}

/** Кабинет мастера (после онбординга). */
export const ADMIN_PATH = '/admin';

/** Платформенная админ-панель (только role platform_admin). */
export const PLATFORM_ADMIN_PATH = '/platform-admin';
export const PLATFORM_ADMIN_REQUESTS_PATH = '/platform-admin/requests';
export const PLATFORM_ADMIN_USERS_PATH = '/platform-admin/users';
export const PLATFORM_ADMIN_MASTERS_PATH = '/platform-admin/masters';
export const PLATFORM_ADMIN_SERVICES_PATH = '/platform-admin/services';
export const PLATFORM_ADMIN_BOOKINGS_PATH = '/platform-admin/bookings';
export const PLATFORM_ADMIN_AUDIT_PATH = '/platform-admin/audit';
export const PLATFORM_ADMIN_BILLING_PATH = '/platform-admin/billing';
export const PLATFORM_ADMIN_PAYMENTS_PATH = '/platform-admin/payments';

/** Страницы возврата с bePaid (UX; статус — только webhook). */
export const PAYMENT_SUCCESS_PATH = '/payment/success';
export const PAYMENT_FAIL_PATH = '/payment/fail';
export const PLATFORM_ADMIN_NOTIFICATIONS_PATH = '/platform-admin/notifications';
export const PLATFORM_ADMIN_NOTIFICATIONS_DIAGNOSTICS_PATH =
  '/platform-admin/notifications/diagnostics';

/** Отписка от newsletter по токену из письма. */
export const UNSUBSCRIBE_NEWSLETTER_PATH = '/unsubscribe/newsletter/:token';

export function getUnsubscribeNewsletterPath(token: string): string {
  return `/unsubscribe/newsletter/${encodeURIComponent(token)}`;
}

/** Разделы кабинета (отдельные страницы). */
export const ADMIN_SERVICES_PATH = '/admin/services';
export const ADMIN_SCHEDULE_PATH = '/admin/schedule';
export const ADMIN_APPOINTMENTS_PATH = '/admin/appointments';
export const ADMIN_OVERVIEW_PATH = '/admin/overview';
export const ADMIN_BILLING_PATH = '/admin/billing';
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications';
/** Кабинет мастера: workspace настроек (SaaS layout). */
export const MASTER_SETTINGS_PATH = '/master/settings';
export const MASTER_SETTINGS_SECURITY_PATH = `${MASTER_SETTINGS_PATH}/security`;
export const MASTER_SETTINGS_NOTIFICATIONS_PATH = `${MASTER_SETTINGS_PATH}/notifications`;
export const MASTER_SETTINGS_BILLING_PATH = `${MASTER_SETTINGS_PATH}/billing`;
export const MASTER_SETTINGS_TEAM_PATH = `${MASTER_SETTINGS_PATH}/team`;
export const MASTER_SETTINGS_INTEGRATIONS_PATH = `${MASTER_SETTINGS_PATH}/integrations`;
export const MASTER_SETTINGS_PRIVACY_PATH = `${MASTER_SETTINGS_PATH}/privacy`;
export const MASTER_SETTINGS_SUPPORT_PATH = `${MASTER_SETTINGS_PATH}/support`;
export const MASTER_SETTINGS_ABOUT_PATH = `${MASTER_SETTINGS_PATH}/about`;

/** @deprecated Используйте MASTER_SETTINGS_*; редиректы сохранены для старых ссылок. */
export const ADMIN_SETTINGS_PATH = '/admin/settings';
export const ADMIN_SETTINGS_LOGIN_METHODS_PATH = '/admin/settings/login-methods';
export const ADMIN_SETTINGS_SUPPORT_PATH = '/admin/settings/support';
export const ADMIN_SETTINGS_SPONSOR_PATH = '/admin/settings/sponsor';
export const ADMIN_SETTINGS_DOCUMENTS_PATH = '/admin/settings/documents';
/** Редирект со старого URL. */
export const ADMIN_LOGIN_METHODS_PATH = MASTER_SETTINGS_SECURITY_PATH;
export const ADMIN_PROFILE_COMPLETION_PATH = '/admin/profile/completion';

/** Политика обработки персональных данных (страница). */
export const LEGAL_PRIVACY_PATH = '/legal/privacy';

/** Согласие на обработку персональных данных (страница). */
export const LEGAL_CONSENT_PATH = '/legal/consent';

/** @deprecated Используйте LEGAL_CONSENT_PATH */
export const LEGAL_PD_CONSENT_PATH = '/legal/consent-pd';

/** Согласие на трансграничную передачу персональных данных. */
export const LEGAL_CROSS_BORDER_PATH = '/legal/cross-border';

/** Пользовательское соглашение (страница). */
export const LEGAL_TERMS_PATH = '/legal/terms';

/** Условия для мастеров. */
export const LEGAL_MASTER_TERMS_PATH = '/legal/master-terms';

/** Оплата и безопасность платежей. */
export const LEGAL_PAYMENT_PATH = '/legal/payment';

/** Возвраты и отмена оплаты. */
export const LEGAL_REFUND_PATH = '/legal/refund';

/** Публичная оферта. */
export const LEGAL_PUBLIC_OFFER_PATH = '/legal/public-offer';

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
