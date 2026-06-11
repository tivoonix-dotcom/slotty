import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import {
  buildMastersTopRankSections,
  isLikelyNewMaster,
  type MastersTopRankSection,
} from './mastersTopRankSections';

export type MasterTopAchievementKind = MastersTopRankSection['id'];

/** Минимум мастеров в категории, чтобы показывать сравнительные достижения. */
export const MIN_ACHIEVEMENT_CATALOG_PEERS = 3;

export type MasterTopAchievement = {
  id: MasterTopAchievementKind;
  /** @deprecated используйте title */
  label: string;
  title: string;
  meta: string;
  description: string;
  /** 1–3 — для tooltip; на карточке всегда «В топе» для week/month */
  podiumRank: 1 | 2 | 3 | null;
  /** Позиция в подборке каталога (1-based), для tooltip */
  catalogRank: number;
  tooltipTitle: string;
  tooltipBody: string;
};

export type MasterTopRankStatus = {
  achievements: MasterTopAchievement[];
  labels: string[];
  primaryLabel: string | null;
  /** false до завершения первого запроса каталога (если используется хук). */
  ready?: boolean;
};

const EMPTY_STATUS: MasterTopRankStatus = {
  achievements: [],
  labels: [],
  primaryLabel: null,
};

const TOP_RANK_META = 'В топе';

function podiumRankFromIndex(index: number): 1 | 2 | 3 | null {
  const rank = index + 1;
  if (rank >= 1 && rank <= 3) return rank as 1 | 2 | 3;
  return null;
}

function formatPodiumPlace(rank: number): string {
  if (rank === 1) return '1-е';
  if (rank === 2) return '2-е';
  if (rank === 3) return '3-е';
  return `${rank}-е`;
}

function topRankTooltipSuffix(catalogRank: number, poolSize: number): string {
  if (poolSize < MIN_ACHIEVEMENT_CATALOG_PEERS) return '';
  if (catalogRank <= 3) {
    return ` Сейчас ${formatPodiumPlace(catalogRank)} место в подборке из ${poolSize} мастеров.`;
  }
  return ` Сейчас ${catalogRank}-е место в подборке из ${poolSize} мастеров.`;
}

function isCompetitiveSection(id: MasterTopAchievementKind): boolean {
  return id === 'week' || id === 'month' || id === 'rating' || id === 'reviews';
}

function buildProfileFallbackAchievements(master: ServiceListingRecord): MasterTopAchievement[] {
  const items: MasterTopAchievement[] = [];

  if (master.rating >= 4.5) {
    const ratingLabel = master.rating.toFixed(1);
    items.push({
      id: 'rating',
      title: 'Высокий рейтинг',
      label: 'Высокий рейтинг',
      meta: ratingLabel,
      description: 'По подтверждённым отзывам',
      podiumRank: null,
      catalogRank: 1,
      tooltipTitle: 'Почему это достижение?',
      tooltipBody: `Средняя оценка мастера — ${ratingLabel} по подтверждённым отзывам клиентов в Slotty.`,
    });
  }

  if (master.reviewsCount >= 1) {
    const reviewsLabel = formatReviewsCountLabel(master.reviewsCount);
    items.push({
      id: 'reviews',
      title: 'Есть отзывы',
      label: 'Есть отзывы',
      meta: reviewsLabel,
      description: 'Клиенты уже оставили мнения',
      podiumRank: null,
      catalogRank: 1,
      tooltipTitle: 'Почему это достижение?',
      tooltipBody: `У мастера ${reviewsLabel.toLowerCase()} — профиль уже получает обратную связь от клиентов Slotty.`,
    });
  }

  if (isLikelyNewMaster(master) && master.reviewsCount < 5) {
    items.push({
      id: 'new',
      title: 'Новая звезда',
      label: 'Новая звезда',
      meta: 'Недавно на Slotty',
      description: 'Профиль активно развивается',
      podiumRank: null,
      catalogRank: 1,
      tooltipTitle: 'Почему это достижение?',
      tooltipBody:
        'Мастер недавно на Slotty и уже получает хорошие оценки при небольшом числе отзывов. ' +
        'Достижение про рост профиля, а не про место в топе.',
    });
  }

  return items;
}

function buildAchievement(
  section: MastersTopRankSection,
  index: number,
  master: ServiceListingRecord,
  catalogSize: number,
): MasterTopAchievement {
  const catalogRank = index + 1;
  const poolSize = section.items.length;
  const podiumRank =
    section.id === 'week' || section.id === 'month' ? podiumRankFromIndex(index) : null;
  const rankNote = topRankTooltipSuffix(catalogRank, Math.max(catalogSize, poolSize));

  switch (section.id) {
    case 'week':
      return {
        id: 'week',
        title: 'В топе недели',
        label: 'В топе недели',
        meta: TOP_RANK_META,
        description: 'В подборке лучших за 7 дней',
        podiumRank,
        catalogRank,
        tooltipTitle: 'Почему это достижение?',
        tooltipBody:
          `Мастер попал в подборку «Топ недели» в категории «${master.category}» — среди сильных мастеров каталога, не только на 1-м месте. ` +
          'Учитываются рейтинг, отзывы, свободные окна и активность за последние 7 дней.' +
          rankNote,
      };
    case 'month':
      return {
        id: 'month',
        title: 'В топе месяца',
        label: 'В топе месяца',
        meta: TOP_RANK_META,
        description: 'В подборке лучших за месяц',
        podiumRank,
        catalogRank,
        tooltipTitle: 'Почему это достижение?',
        tooltipBody:
          `Мастер в подборке «Топ месяца» в категории «${master.category}» — это топ мастеров каталога, а не только победитель конкурса. ` +
          'Учитываются рейтинг, отзывы, записи и стабильность профиля.' +
          rankNote,
      };
    case 'rating': {
      const ratingLabel = master.rating > 0 ? master.rating.toFixed(1) : '—';
      return {
        id: 'rating',
        title: 'Лучший рейтинг',
        label: 'Лучший рейтинг',
        meta: ratingLabel,
        description: 'Среди лидеров по оценке',
        podiumRank: null,
        catalogRank,
        tooltipTitle: 'Почему это достижение?',
        tooltipBody:
          `Средняя оценка мастера — ${ratingLabel} по подтверждённым отзывам. ` +
          `Профиль в топ-${poolSize} рейтинга категории «${master.category}» среди других мастеров Slotty.` +
          rankNote,
      };
    }
    case 'reviews': {
      const reviewsLabel =
        master.reviewsCount > 0 ? formatReviewsCountLabel(master.reviewsCount) : 'Пока нет отзывов';
      return {
        id: 'reviews',
        title: 'Много отзывов',
        label: 'Много отзывов',
        meta: reviewsLabel,
        description: 'Среди лидеров категории',
        podiumRank: null,
        catalogRank,
        tooltipTitle: 'Почему это достижение?',
        tooltipBody:
          `У мастера ${reviewsLabel.toLowerCase()} — профиль в топ-${poolSize} категории «${master.category}» по числу отзывов. ` +
          'Достижение выдаётся за сравнение с другими мастерами, а не за фиксированное «1 место».' +
          rankNote,
      };
    }
    case 'new':
      return {
        id: 'new',
        title: 'Новая звезда',
        label: 'Новая звезда',
        meta: 'Недавно на Slotty',
        description: 'Профиль активно развивается',
        podiumRank: null,
        catalogRank,
        tooltipTitle: 'Почему это достижение?',
        tooltipBody:
          'Мастер недавно на Slotty и уже получает хорошие оценки при небольшом числе отзывов. ' +
          'Достижение про рост профиля, а не про место в топе.',
      };
  }
}

export function resolveMasterTopRankStatus(
  masterId: string,
  catalogMasters: ServiceListingRecord[],
): MasterTopRankStatus {
  if (!masterId.trim() || catalogMasters.length === 0) {
    return EMPTY_STATUS;
  }

  const master = catalogMasters.find((item) => item.masterId === masterId);
  if (!master) {
    return EMPTY_STATUS;
  }

  const catalogSize = catalogMasters.length;
  const sections = buildMastersTopRankSections(catalogMasters);
  const achievements: MasterTopAchievement[] = [];

  for (const section of sections) {
    const index = section.items.findIndex((item) => item.masterId === masterId);
    if (index < 0) continue;

    if (isCompetitiveSection(section.id) && catalogSize < MIN_ACHIEVEMENT_CATALOG_PEERS) {
      continue;
    }

    if (section.id === 'rating' && master.rating <= 0) continue;
    if (section.id === 'reviews' && master.reviewsCount <= 0) continue;
    if (section.id === 'new' && master.reviewsCount >= 5) continue;

    achievements.push(buildAchievement(section, index, master, catalogSize));
  }

  if (catalogSize < MIN_ACHIEVEMENT_CATALOG_PEERS) {
    const existingIds = new Set(achievements.map((item) => item.id));
    for (const item of buildProfileFallbackAchievements(master)) {
      if (!existingIds.has(item.id)) {
        achievements.push(item);
        existingIds.add(item.id);
      }
    }
  }

  const labels = achievements.map((item) => item.title);
  return {
    achievements,
    labels,
    primaryLabel: labels[0] ?? null,
  };
}
