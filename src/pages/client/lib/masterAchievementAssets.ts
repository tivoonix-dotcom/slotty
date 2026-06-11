import type { MasterTopAchievementKind } from './resolveMasterTopRankStatus';

const AWARDS_DIR = `/photos/awards`;

function awardArt(filename: string): string {
  return `${AWARDS_DIR}/${filename}`;
}

/** Иллюстрации достижений — PNG из public/photos/awards. */
export const MASTER_ACHIEVEMENT_ART: Record<MasterTopAchievementKind, string> = {
  week: awardArt('top-week.webp'),
  month: awardArt('top-month.webp'),
  rating: awardArt('star-rating.webp'),
  reviews: awardArt('many-reviews.webp'),
  new: awardArt('recently-joined.webp'),
};

/** Пустой блок достижений на публичном профиле. */
export const MASTER_ACHIEVEMENTS_EMPTY_ART = awardArt('no-achievements.webp');

export function inferAchievementKindFromTitle(title: string): MasterTopAchievementKind | null {
  const q = title.toLowerCase();
  if (q.includes('недел')) return 'week';
  if (q.includes('месяц')) return 'month';
  if (q.includes('лучш') || q.includes('рейтинг') || q.includes('оцен')) return 'rating';
  if (q.includes('отзыв')) return 'reviews';
  if (q.includes('нов') || q.includes('звезд') || q.includes('недавн')) return 'new';
  return null;
}

/** PNG достижения по типу; при сбое — по тексту заголовка. */
export function resolveMasterAchievementArt(
  kind: MasterTopAchievementKind | undefined | null,
  title?: string,
): string {
  if (kind && MASTER_ACHIEVEMENT_ART[kind]) return MASTER_ACHIEVEMENT_ART[kind];
  const inferred = title ? inferAchievementKindFromTitle(title) : null;
  if (inferred) return MASTER_ACHIEVEMENT_ART[inferred];
  return MASTER_ACHIEVEMENTS_EMPTY_ART;
}
