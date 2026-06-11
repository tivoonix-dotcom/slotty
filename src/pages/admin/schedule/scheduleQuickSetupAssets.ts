const BASE = '/photos/quick-setup';

export const SCHEDULE_QUICK_SETUP_IMAGES = {
  today: `${BASE}/1.webp`,
  week: `${BASE}/2.webp`,
  month: `${BASE}/3.webp`,
  fromSchedule: `${BASE}/4.webp`,
  templatesBg: `${BASE}/templates-bg.webp`,
  /** Фон hero вкладки «Список» (`public/photos/quick-setup/hero-bg.webp`). */
  listHeroBg: `${BASE}/hero-bg.webp`,
  /** Фон кнопки «+» и активного таба «Создать» на мобилке. */
  tabCreateActiveBg: `${BASE}/hero-bg.webp`,
} as const;
