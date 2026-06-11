const DIR = '/photos/podium';

/** Задний фон пьедестала для 1–3 мест (`public/photos/podium/`). */
export const TOP_MASTERS_PODIUM_BG = {
  1: `${DIR}/1.webp`,
  2: `${DIR}/2.webp`,
  3: `${DIR}/3.webp`,
} as const;

export type TopMastersPodiumRank = keyof typeof TOP_MASTERS_PODIUM_BG;
