import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  getMastersCatalogPath,
  getServiceCategoryPath,
  MASTERS_PATH,
  SERVICES_PATH,
} from '../../../app/paths';
import {
  landingHowTabHref,
  landingMastersTabHref,
  LANDING_ANCHOR_FOR_MASTERS,
  LANDING_ANCHOR_HOW,
  LANDING_ANCHOR_TARIFFS,
  LANDING_HOW_TAB_BOOKING,
  LANDING_HOW_TAB_HISTORY,
  LANDING_HOW_TAB_REMINDERS,
  LANDING_HOW_TAB_SERVICE,
  LANDING_HOW_TAB_SLOTS,
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_OVERVIEW,
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_SCHEDULE,
  LANDING_MASTERS_TAB_SERVICES,
} from './headerNav';

export type MegaMenuKey = 'catalog' | 'masters' | 'how' | 'mastersFor' | 'tariffs';

export type MegaMenuItem = {
  title: string;
  description: string;
  badge?: string;
  to?: string;
  anchor?: string;
  accent?: 'pink' | 'violet' | 'blue' | 'green' | 'orange';
};

export type MegaMenuGroup = {
  label: string;
  to?: string;
  anchor?: string;
  items: MegaMenuItem[];
};

export const MEGA_MENU: Record<MegaMenuKey, MegaMenuGroup> = {
  catalog: {
    label: 'Каталог',
    to: SERVICES_PATH,
    items: [
      {
        title: 'Маникюр',
        badge: 'POPULAR',
        description: 'Мастера рядом, цены, свободные окна и быстрая запись.',
        to: getServiceCategoryPath('manicure'),
        accent: 'pink',
      },
      {
        title: 'Барберы',
        description: 'Стрижки, борода, уход, портфолио мастеров и отзывы.',
        to: getServiceCategoryPath('barbers'),
        accent: 'blue',
      },
      {
        title: 'Брови и ресницы',
        description: 'Коррекция, окрашивание, ламинирование и запись без переписок.',
        to: getServiceCategoryPath('brows-lashes'),
        accent: 'violet',
      },
      {
        title: 'Массаж',
        description: 'Подбор мастера по району, цене, рейтингу и ближайшему времени.',
        to: getServiceCategoryPath('massage'),
        accent: 'green',
      },
      {
        title: 'Фитнес и тату',
        badge: 'NEW',
        description: 'Категории, где важны портфолио, расписание и доверие.',
        to: getServiceCategoryPath('fitness'),
        accent: 'orange',
      },
    ],
  },

  masters: {
    label: 'Мастера',
    to: MASTERS_PATH,
    items: [
      {
        title: 'Лучшие мастера',
        description: 'Карточки специалистов с рейтингом, услугами, адресом и фото работ.',
        to: getMastersCatalogPath({ sort: 'rating', rating: true }),
        accent: 'pink',
      },
      {
        title: 'Свободные окна',
        badge: 'FAST',
        description: 'Показываем, когда можно записаться сегодня, завтра или на неделе.',
        to: getMastersCatalogPath({ slots: true, sort: 'soonest' }),
        accent: 'blue',
      },
      {
        title: 'Портфолио',
        description: 'Фото работ, сертификаты и визуальная проверка качества мастера.',
        to: getMastersCatalogPath({ verified: true }),
        accent: 'violet',
      },
      {
        title: 'Отзывы клиентов',
        description: 'Помогают выбрать мастера быстрее и повышают доверие к записи.',
        to: getMastersCatalogPath({ sort: 'reviews', reviews: '20' }),
        accent: 'green',
      },
      {
        title: 'Запись 24/7',
        description: 'Клиент выбирает услугу, время и отправляет заявку без звонков.',
        to: getMastersCatalogPath({ slots: true }),
        accent: 'orange',
      },
    ],
  },

  how: {
    label: 'Как это работает',
    anchor: LANDING_ANCHOR_HOW,
    items: [
      {
        title: 'Выбор услуги',
        description: 'Клиент открывает каталог, выбирает категорию, мастера или услугу.',
        to: landingHowTabHref(LANDING_HOW_TAB_SERVICE),
        accent: 'pink',
      },
      {
        title: 'Свободное время',
        description: 'Система показывает реальные окна мастера и доступные даты.',
        to: landingHowTabHref(LANDING_HOW_TAB_SLOTS),
        accent: 'blue',
      },
      {
        title: 'Заявка на запись',
        description: 'Клиент оставляет заявку, а мастер видит ее в своем кабинете.',
        to: landingHowTabHref(LANDING_HOW_TAB_BOOKING),
        accent: 'violet',
      },
      {
        title: 'Telegram-напоминания',
        badge: 'AUTO',
        description: 'Напоминания помогают не забывать о записи и уменьшают неявки.',
        to: landingHowTabHref(LANDING_HOW_TAB_REMINDERS),
        accent: 'green',
      },
      {
        title: 'История записей',
        description: 'Будущие и прошлые записи хранятся в понятном интерфейсе.',
        to: landingHowTabHref(LANDING_HOW_TAB_HISTORY),
        accent: 'orange',
      },
    ],
  },

  mastersFor: {
    label: 'Для мастеров',
    anchor: LANDING_ANCHOR_FOR_MASTERS,
    items: [],
  },

  tariffs: {
    label: 'Тарифы',
    anchor: LANDING_ANCHOR_TARIFFS,
    items: [
      {
        title: 'Free',
        badge: 'START',
        description: 'Базовый профиль мастера и возможность принимать первые заявки.',
        to: ADMIN_BILLING_PATH,
        accent: 'pink',
      },
      {
        title: 'Pro',
        badge: 'BEST',
        description: 'Больше возможностей для мастера, продвижения и управления записями.',
        to: ADMIN_BILLING_PATH,
        accent: 'blue',
      },
    ],
  },
};

const MASTERS_FOR_MEGA_META: Omit<MegaMenuItem, 'to'>[] = [
  {
    title: 'Профиль мастера',
    badge: 'PRO',
    description: 'Аватар, описание, адрес, контакты, категории, сертификаты и портфолио.',
    accent: 'pink',
  },
  {
    title: 'Заявки клиентов',
    description: 'Новые, предстоящие и завершенные записи в одном удобном месте.',
    accent: 'blue',
  },
  {
    title: 'Услуги и цены',
    description: 'Мастер сам добавляет услуги, длительность, стоимость и описание.',
    accent: 'violet',
  },
  {
    title: 'График и окна',
    description: 'Рабочие дни, время приема, свободные окна и управление расписанием.',
    accent: 'green',
  },
  {
    title: 'Сводка и аналитика',
    description: 'Записи, выручка, активность клиентов и подсказки для роста.',
    accent: 'orange',
  },
];

export function getMastersForMegaItems(isMasterUser: boolean): MegaMenuItem[] {
  const destinations = isMasterUser
    ? [
        ADMIN_PROFILE_COMPLETION_PATH,
        ADMIN_APPOINTMENTS_PATH,
        ADMIN_SERVICES_PATH,
        ADMIN_SCHEDULE_PATH,
        ADMIN_OVERVIEW_PATH,
      ]
    : [
        landingMastersTabHref(LANDING_MASTERS_TAB_PROFILE),
        landingMastersTabHref(LANDING_MASTERS_TAB_APPOINTMENTS),
        landingMastersTabHref(LANDING_MASTERS_TAB_SERVICES),
        landingMastersTabHref(LANDING_MASTERS_TAB_SCHEDULE),
        landingMastersTabHref(LANDING_MASTERS_TAB_OVERVIEW),
      ];

  return MASTERS_FOR_MEGA_META.map((item, index) => ({
    ...item,
    to: destinations[index],
  }));
}

export function resolveMegaMenuGroup(key: MegaMenuKey, isMasterUser: boolean): MegaMenuGroup {
  const group = MEGA_MENU[key];
  if (key === 'mastersFor') {
    return { ...group, items: getMastersForMegaItems(isMasterUser) };
  }
  return group;
}
