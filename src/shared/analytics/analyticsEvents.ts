import { dispatchAnalyticsEvent } from './analyticsAdapter';

/**
 * События для рекламной и продуктовой аналитики.
 * Провайдеры: Yandex Metrika (`VITE_YANDEX_METRIKA_ID`), GA4 (`VITE_GA_MEASUREMENT_ID`), GTM (`VITE_GTM_CONTAINER_ID`).
 * Без env ID аналитика не активируется.
 */
export const ANALYTICS_EVENTS = {
  catalogOpen: 'catalog_open',
  masterProfileOpen: 'master_profile_open',
  serviceSelect: 'service_select',
  slotSelect: 'slot_select',
  bookingCreate: 'booking_create',
  masterRegisterStart: 'master_register_start',
  masterServiceCreate: 'master_service_create',
  masterSlotCreate: 'master_slot_create',
  masterProfilePublish: 'master_profile_publish',
  masterProUpgradeClick: 'master_pro_upgrade_click',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventPayload = Record<string, string | number | boolean | null | undefined>;

/** Единая точка трекинга: dev — console.debug, prod — провайдеры при наличии env. */
export function trackAnalyticsEvent(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- dev-only diagnostics
    console.debug('[analytics]', name, payload ?? {});
  }
  dispatchAnalyticsEvent(name, payload);
}
