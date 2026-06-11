import {
  ADMIN_SETTINGS_PATH,
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  HUB_PATH,
  MASTER_START_PATH,
  SERVICES_PATH,
} from '../../../app/paths';

/** Якоря на лендинге (`/book`). */
export const LANDING_ANCHOR_HOW = 'how-it-works';
export const LANDING_ANCHOR_FOR_MASTERS = 'for-masters';
export const LANDING_ANCHOR_TARIFFS = 'tarify';
export const LANDING_ANCHOR_FAQ = 'faq';

/** Hero лендинга мастера (`/master/start`). */
export const LANDING_ANCHOR_MASTER_HOME = 'master-hero';

/** Табы блока «Как это работает» на лендинге. */
export const LANDING_HOW_TAB_SERVICE = 'how-service';
export const LANDING_HOW_TAB_SLOTS = 'how-slots';
export const LANDING_HOW_TAB_BOOKING = 'how-booking';
export const LANDING_HOW_TAB_REMINDERS = 'how-reminders';
export const LANDING_HOW_TAB_HISTORY = 'how-history';

export const LANDING_HOW_TAB_IDS = [
  LANDING_HOW_TAB_SERVICE,
  LANDING_HOW_TAB_SLOTS,
  LANDING_HOW_TAB_BOOKING,
  LANDING_HOW_TAB_REMINDERS,
  LANDING_HOW_TAB_HISTORY,
] as const;

export type LandingHowTabId = (typeof LANDING_HOW_TAB_IDS)[number];

export function landingAnchorHref(anchor: string): string {
  return `${HUB_PATH}#${anchor}`;
}

export function masterLandingAnchorHref(anchor: string): string {
  return `${MASTER_START_PATH}#${anchor}`;
}

export function landingHowTabHref(tab: LandingHowTabId): string {
  return landingAnchorHref(tab);
}

export function parseLandingHowTab(hash: string): LandingHowTabId {
  const id = hash.replace(/^#/, '');
  if ((LANDING_HOW_TAB_IDS as readonly string[]).includes(id)) return id as LandingHowTabId;
  if (id === LANDING_ANCHOR_HOW || !id) return LANDING_HOW_TAB_SERVICE;
  return LANDING_HOW_TAB_SERVICE;
}

/** Табы блока «Для мастеров» на лендинге (для гостей / будущих мастеров). */
export const LANDING_MASTERS_TAB_PROFILE = 'for-masters-profile';
export const LANDING_MASTERS_TAB_APPOINTMENTS = 'for-masters-appointments';
export const LANDING_MASTERS_TAB_SERVICES = 'for-masters-services';
export const LANDING_MASTERS_TAB_SCHEDULE = 'for-masters-schedule';
export const LANDING_MASTERS_TAB_OVERVIEW = 'for-masters-overview';

export const LANDING_MASTERS_TAB_IDS = [
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_SERVICES,
  LANDING_MASTERS_TAB_SCHEDULE,
  LANDING_MASTERS_TAB_OVERVIEW,
] as const;

export type LandingMastersTabId = (typeof LANDING_MASTERS_TAB_IDS)[number];

export function landingMastersTabHref(tab: LandingMastersTabId): string {
  return landingAnchorHref(tab);
}

export function parseLandingMastersTab(hash: string): LandingMastersTabId {
  const id = hash.replace(/^#/, '');
  if ((LANDING_MASTERS_TAB_IDS as readonly string[]).includes(id)) return id as LandingMastersTabId;
  if (id === LANDING_ANCHOR_FOR_MASTERS || !id) return LANDING_MASTERS_TAB_PROFILE;
  return LANDING_MASTERS_TAB_PROFILE;
}

export function isLandingMastersTab(id: string): id is LandingMastersTabId {
  return (LANDING_MASTERS_TAB_IDS as readonly string[]).includes(id);
}

export function isLandingHowTab(id: string): id is LandingHowTabId {
  return (LANDING_HOW_TAB_IDS as readonly string[]).includes(id);
}

export function isMasterLandingAnchor(anchor: string): boolean {
  return (
    isLandingMastersTab(anchor) ||
    anchor === LANDING_ANCHOR_FOR_MASTERS ||
    anchor === LANDING_ANCHOR_TARIFFS ||
    anchor === LANDING_ANCHOR_MASTER_HOME
  );
}

/** Якоря, которые есть только на клиентском лендинге (`/book`). */
export function isClientLandingAnchor(anchor: string): boolean {
  return isLandingHowTab(anchor) || anchor === LANDING_ANCHOR_HOW;
}

export const SLOTTY_NAV_CATALOG = { label: 'Каталог', to: SERVICES_PATH } as const;
export const SLOTTY_NAV_MASTERS = { label: 'Мастера', to: SERVICES_PATH } as const;

export const SLOTTY_NAV_ANCHORS = [
  { label: 'Как это работает', anchor: LANDING_ANCHOR_HOW },
  { label: 'Для мастеров', to: MASTER_START_PATH },
  { label: 'Тарифы', to: `${MASTER_START_PATH}#${LANDING_ANCHOR_TARIFFS}` },
] as const;

export const SLOTTY_MOBILE_MENU = [
  SLOTTY_NAV_CATALOG,
  SLOTTY_NAV_MASTERS,
  { label: 'Как это работает', anchor: LANDING_ANCHOR_HOW },
  { label: 'Для мастеров', to: MASTER_START_PATH },
  { label: 'Тарифы', to: `${MASTER_START_PATH}#${LANDING_ANCHOR_TARIFFS}` },
  { label: 'FAQ', anchor: LANDING_ANCHOR_FAQ },
] as const;

export { HUB_PATH, ADMIN_PATH, BECOME_MASTER_PATH, ADMIN_SETTINGS_PATH };
