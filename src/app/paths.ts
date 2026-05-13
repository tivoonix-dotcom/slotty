/** Главный хаб (лендинг, поиск, лента). */
export const HUB_PATH = '/book';

/** Поиск услуг для клиента. */
export const SERVICES_PATH = '/services';

/** Мой профиль: записи, избранное, настройки (вкладки через query). */
export const PROFILE_PATH = '/profile';

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

/** Шаблон маршрута профиля мастера (для документации / Route). */
export const MASTER_PATH = '/master/:id';

export function getMasterPath(masterId: string): string {
  return `/master/${encodeURIComponent(masterId)}`;
}

/** Ссылка на профиль; `tab`: appointments | favorites | settings. */
export function getProfilePath(tab?: 'appointments' | 'favorites' | 'settings'): string {
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
