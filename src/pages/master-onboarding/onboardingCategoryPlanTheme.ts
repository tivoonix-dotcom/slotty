import { resolveServiceCategorySlug } from '../../constants/serviceTemplates';

export type CategoryPlanTheme = {
  code: string;
  planPhoto: string;
  accent: string;
  accentSoft: string;
  accentRing: string;
  panelBg: string;
  panelBorder: string;
  heroGradient: string;
  chipActive: string;
  chipIdle: string;
};

const THEMES: Record<string, CategoryPlanTheme> = {
  manicure: {
    code: 'manicure',
    planPhoto: '/photos/plan/manicure.webp',
    accent: '#E29595',
    accentSoft: '#FFF1F4',
    accentRing: '#F9D0D6',
    panelBg: '#FBF4F4',
    panelBorder: 'rgba(226, 149, 149, 0.22)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.08) 0%, rgba(17,17,17,0.42) 52%, rgba(17,17,17,0.78) 100%)',
    chipActive: '#E29595',
    chipIdle: '#F5E8E8',
  },
  barbers: {
    code: 'barbers',
    planPhoto: '/photos/plan/barber.webp',
    accent: '#8B5E3C',
    accentSoft: '#F6F0EB',
    accentRing: '#D4B896',
    panelBg: '#F8F4F0',
    panelBorder: 'rgba(139, 94, 60, 0.2)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.1) 0%, rgba(17,17,17,0.45) 55%, rgba(17,17,17,0.82) 100%)',
    chipActive: '#8B5E3C',
    chipIdle: '#EDE4DB',
  },
  'brows-lashes': {
    code: 'brows-lashes',
    planPhoto: '/photos/plan/brows.webp',
    accent: '#B07A9A',
    accentSoft: '#FAF2F6',
    accentRing: '#E8C4D6',
    panelBg: '#FAF5F8',
    panelBorder: 'rgba(176, 122, 154, 0.22)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.06) 0%, rgba(17,17,17,0.4) 52%, rgba(17,17,17,0.76) 100%)',
    chipActive: '#B07A9A',
    chipIdle: '#F0E6EC',
  },
  massage: {
    code: 'massage',
    planPhoto: '/photos/plan/massage.webp',
    accent: '#5F8F7B',
    accentSoft: '#EFF6F2',
    accentRing: '#B8D4C8',
    panelBg: '#F2F8F5',
    panelBorder: 'rgba(95, 143, 123, 0.22)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.08) 0%, rgba(17,17,17,0.42) 52%, rgba(17,17,17,0.78) 100%)',
    chipActive: '#5F8F7B',
    chipIdle: '#E3EEE8',
  },
  fitness: {
    code: 'fitness',
    planPhoto: '/photos/plan/fitness.webp',
    accent: '#D97745',
    accentSoft: '#FFF4ED',
    accentRing: '#F5C9A8',
    panelBg: '#FBF6F2',
    panelBorder: 'rgba(217, 119, 69, 0.22)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.1) 0%, rgba(17,17,17,0.44) 54%, rgba(17,17,17,0.8) 100%)',
    chipActive: '#D97745',
    chipIdle: '#F8E8DE',
  },
  tattoo: {
    code: 'tattoo',
    planPhoto: '/photos/plan/tattoo.webp',
    accent: '#5C4D6E',
    accentSoft: '#F3F0F6',
    accentRing: '#C4B8D4',
    panelBg: '#F6F4F8',
    panelBorder: 'rgba(92, 77, 110, 0.22)',
    heroGradient:
      'linear-gradient(180deg, rgba(17,17,17,0.12) 0%, rgba(17,17,17,0.48) 55%, rgba(17,17,17,0.85) 100%)',
    chipActive: '#5C4D6E',
    chipIdle: '#E8E4ED',
  },
};

/** Круглые иконки в карточках — как раньше, из work/ */
export const CATEGORY_CARD_ICONS: Record<string, string> = {
  manicure: '/photos/work/manicure.webp',
  barbers: '/photos/work/barbers.webp',
  'brows-lashes': '/photos/work/brows_lashes.webp',
  massage: '/photos/work/massage.webp',
  fitness: '/photos/work/fitness.webp',
  tattoo: '/photos/work/tattoo.webp',
};

export const CATEGORY_HINTS: Record<string, string> = {
  manicure: 'Ногти и уход',
  barbers: 'Стрижки и борода',
  'brows-lashes': 'Брови и ресницы',
  massage: 'Расслабление',
  fitness: 'Тренировки',
  tattoo: 'Тату и эскизы',
};

export function getCategoryPlanTheme(code: string | undefined | null): CategoryPlanTheme | null {
  const slug = resolveServiceCategorySlug(code);
  if (!slug) return null;
  return THEMES[slug] ?? null;
}

