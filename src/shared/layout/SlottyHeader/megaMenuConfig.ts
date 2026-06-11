import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  getMastersCatalogPath,
  getServiceCategoryPath,
  getServicesCatalogPath,
  MASTER_START_PATH,
  SERVICES_PATH,
} from '../../../app/paths';
import {
  landingHowTabHref,
  masterLandingAnchorHref,
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

export type MegaMenuKey = 'catalog' | 'masters' | 'how' | 'services' | 'mastersFor' | 'tariffs';

export type MegaMenuItem = {
  title: string;
  description: string;
  badge?: string;
  to?: string;
  anchor?: string;
  accent?: 'pink' | 'violet' | 'blue' | 'green' | 'orange';
  /** Явная иконка строки (меню аккаунта). */
  icon?: import('react-icons').IconType;
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
    to: SERVICES_PATH,
    items: [
      {
        title: 'Топ рейтинг',
        badge: 'HOT',
        description: 'Лучшие мастера по оценкам клиентов и проверенным отзывам.',
        to: getMastersCatalogPath({ tab: 'top' }),
        accent: 'pink',
      },
      {
        title: 'Сегодня',
        badge: 'FAST',
        description: 'Мастера со свободными окнами — запись в ближайшие часы.',
        to: getMastersCatalogPath({ tab: 'today' }),
        accent: 'blue',
      },
      {
        title: 'Рядом',
        description: 'Сортировка по близости и ближайшему свободному времени.',
        to: getMastersCatalogPath({ tab: 'near' }),
        accent: 'violet',
      },
      {
        title: 'По отзывам',
        description: 'Специалисты с большим числом отзывов и высоким доверием.',
        to: getMastersCatalogPath({ sort: 'reviews', reviews: '20' }),
        accent: 'green',
      },
      {
        title: 'Сначала дешевле',
        description: 'Подбор мастеров по цене — от доступных услуг к премиум.',
        to: getMastersCatalogPath({ sort: 'price_asc' }),
        accent: 'orange',
      },
    ],
  },

  services: {
    label: 'Услуги',
    to: SERVICES_PATH,
    items: [
      {
        title: 'Популярные',
        badge: 'HOT',
        description: 'Услуги с высоким спросом, хитами и быстрой записью.',
        to: getServicesCatalogPath({ tab: 'popular' }),
        accent: 'pink',
      },
      {
        title: 'С акциями',
        badge: 'SALE',
        description: 'Скидки и спецпредложения от мастеров в вашем районе.',
        to: getServicesCatalogPath({ tab: 'promo' }),
        accent: 'blue',
      },
      {
        title: 'Ближайшее время',
        badge: 'FAST',
        description: 'Сортировка по свободным окнам — запись сегодня или завтра.',
        to: getServicesCatalogPath({ sort: 'soonest' }),
        accent: 'violet',
      },
      {
        title: 'По рейтингу',
        description: 'Лучшие услуги по оценкам клиентов и отзывам.',
        to: getServicesCatalogPath({ sort: 'rating' }),
        accent: 'green',
      },
      {
        title: 'Сначала дешевле',
        description: 'Подбор по цене — от доступных процедур к премиум.',
        to: getServicesCatalogPath({ sort: 'price_asc' }),
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
    to: MASTER_START_PATH,
    items: [],
  },

  tariffs: {
    label: 'Тарифы',
    anchor: LANDING_ANCHOR_TARIFFS,
    to: `${MASTER_START_PATH}#${LANDING_ANCHOR_TARIFFS}`,
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
        masterLandingAnchorHref(LANDING_MASTERS_TAB_PROFILE),
        masterLandingAnchorHref(LANDING_MASTERS_TAB_APPOINTMENTS),
        masterLandingAnchorHref(LANDING_MASTERS_TAB_SERVICES),
        masterLandingAnchorHref(LANDING_MASTERS_TAB_SCHEDULE),
        masterLandingAnchorHref(LANDING_MASTERS_TAB_OVERVIEW),
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
