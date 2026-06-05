const BASE = '/photos/quick-setup';
const QUICK_SETUP_ORIGINAL_DIR = `/photos/${encodeURIComponent('Быстрая настройка')}`;

export const SCHEDULE_QUICK_SETUP_IMAGES = {
  today: `${BASE}/1.png`,
  week: `${BASE}/2.png`,
  month: `${BASE}/3.png`,
  fromSchedule: `${BASE}/4.png`,
  templatesBg: `${BASE}/templates-bg.png`,
  /** Фон hero вкладки «Список» (`public/photos/Быстрая настройка/задний фон.png`). */
  listHeroBg: `${QUICK_SETUP_ORIGINAL_DIR}/${encodeURIComponent('задний фон.png')}`,
} as const;
