const landingServicePhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent('услуги')}/${encodeURIComponent(file)}`;

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
    image: landingServicePhoto('маниюкр.png'),
  },
  {
    key: 'barbers',
    label: 'Парикмахерская',
    headline: 'Стрижки и уход — лучшие мастера рядом.',
    image: landingServicePhoto('парихмахерская.png'),
  },
  {
    key: 'brows-lashes',
    label: 'Брови и ресницы',
    headline: 'Выразительный взгляд — запись за минуту.',
    image: landingServicePhoto('брови.png'),
  },
  {
    key: 'massage',
    label: 'Массаж',
    headline: 'Расслабься — мастера массажа в твоём телефоне.',
    image: landingServicePhoto('массаж.png'),
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    headline: 'Тренировки и зал — когда удобно тебе.',
    image: landingServicePhoto('зал.png'),
  },
  {
    key: 'tattoo',
    label: 'Тату',
    headline: 'Тату и перманент — с портфолио мастеров.',
    image: landingServicePhoto('тату.png'),
  },
] as const;
