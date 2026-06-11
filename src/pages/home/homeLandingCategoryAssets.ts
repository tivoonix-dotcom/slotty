export type HomeLandingCategory = {
  key: string;
  label: string;
  headline: string;
  image: string;
};

export const HOME_LANDING_CATEGORIES: readonly HomeLandingCategory[] = [
  {
    key: 'manicure',
    label: 'Маникюр',
    headline: 'Идеальный маникюр — в пару кликов от тебя.',
    image: '/photos/landing/services-showcase/manicure.webp',
  },
  {
    key: 'barbers',
    label: 'Парикмахерская',
    headline: 'Стрижки и уход — лучшие мастера рядом.',
    image: '/photos/landing/services-showcase/barbershop.webp',
  },
  {
    key: 'brows-lashes',
    label: 'Брови и ресницы',
    headline: 'Выразительный взгляд — запись за минуту.',
    image: '/photos/landing/services-showcase/brows.webp',
  },
  {
    key: 'massage',
    label: 'Массаж',
    headline: 'Расслабься — мастера массажа в твоём телефоне.',
    image: '/photos/landing/services-showcase/massage.webp',
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    headline: 'Тренировки и зал — когда удобно тебе.',
    image: '/photos/landing/services-showcase/gym.webp',
  },
  {
    key: 'tattoo',
    label: 'Тату',
    headline: 'Тату и перманент — с портфолио мастеров.',
    image: '/photos/landing/services-showcase/tattoo.webp',
  },
] as const;
