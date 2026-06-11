import {
  HiClipboardDocumentList,
  HiCog6Tooth,
  HiHome,
  HiRectangleStack,
  HiUserGroup,
  HiUsers,
  HiCalendarDays,
  HiBanknotes,
  HiEnvelope,
  HiLifebuoy,
} from 'react-icons/hi2';
import {
  PLATFORM_ADMIN_AUDIT_PATH,
  PLATFORM_ADMIN_BILLING_PATH,
  PLATFORM_ADMIN_PAYMENTS_PATH,
  PLATFORM_ADMIN_BOOKINGS_PATH,
  PLATFORM_ADMIN_MASTERS_PATH,
  PLATFORM_ADMIN_NOTIFICATIONS_PATH,
  PLATFORM_ADMIN_PATH,
  PLATFORM_ADMIN_REQUESTS_PATH,
  PLATFORM_ADMIN_SUPPORT_PATH,
  PLATFORM_ADMIN_SYSTEM_STATUS_PATH,
  PLATFORM_ADMIN_SERVICES_PATH,
  PLATFORM_ADMIN_USERS_PATH,
} from '../../app/paths';

export type PlatformAdminNavItem = {
  to: string;
  label: string;
  icon: typeof HiHome;
  end?: boolean;
  title: string;
  description: string;
};

export const PLATFORM_ADMIN_NAV: PlatformAdminNavItem[] = [
  {
    to: PLATFORM_ADMIN_PATH,
    label: 'Обзор',
    icon: HiHome,
    end: true,
    title: 'Обзор платформы',
    description: 'Ключевые цифры: пользователи, мастера, записи и что требует внимания прямо сейчас.',
  },
  {
    to: PLATFORM_ADMIN_REQUESTS_PATH,
    label: 'Заявки',
    icon: HiClipboardDocumentList,
    title: 'Заявки',
    description:
      'Смена категории мастера и заявки «Стать спонсором SLOTTY». Обработайте запрос и оставьте комментарий при отклонении.',
  },
  {
    to: PLATFORM_ADMIN_SUPPORT_PATH,
    label: 'Поддержка',
    icon: HiLifebuoy,
    title: 'Поддержка SLOTTY',
    description: 'Обращения мастеров: тикеты, статусы, ответы и эскалация.',
  },
  {
    to: PLATFORM_ADMIN_SYSTEM_STATUS_PATH,
    label: 'Статус',
    icon: HiCog6Tooth,
    title: 'Статус системы',
    description: 'Компоненты платформы, инциденты, плановые работы и health checks.',
  },
  {
    to: PLATFORM_ADMIN_USERS_PATH,
    label: 'Пользователи',
    icon: HiUsers,
    title: 'Пользователи',
    description:
      'Все аккаунты на платформе. Блокировка — полный запрет входа. Ограничение — вход есть, но нельзя создавать записи и контент.',
  },
  {
    to: PLATFORM_ADMIN_MASTERS_PATH,
    label: 'Мастера',
    icon: HiUserGroup,
    title: 'Мастера',
    description:
      'Профили в каталоге: тариф Free/Pro, история попыток оплаты, подписка и модерация (скрыть / пауза).',
  },
  {
    to: PLATFORM_ADMIN_SERVICES_PATH,
    label: 'Услуги',
    icon: HiRectangleStack,
    title: 'Услуги',
    description:
      'Прайс по мастерам: выберите мастера, просмотрите услуги, скройте с обязательной причиной или верните в каталог.',
  },
  {
    to: PLATFORM_ADMIN_BOOKINGS_PATH,
    label: 'Записи',
    icon: HiCalendarDays,
    title: 'Записи',
    description:
      'Кто записался и кто отменил. Раздел «Частые отмены» — клиенты для блокировки при злоупотреблениях.',
  },
  {
    to: PLATFORM_ADMIN_BILLING_PATH,
    label: 'Биллинг',
    icon: HiBanknotes,
    title: 'Биллинг',
    description:
      'Покупки тарифа Pro, сводка по выручке и промокоды со скидкой при оформлении подписки.',
  },
  {
    to: PLATFORM_ADMIN_PAYMENTS_PATH,
    label: 'Платежи',
    icon: HiBanknotes,
    title: 'Платежи bePaid',
    description:
      'Онлайн-платежи через bePaid: статусы из webhook, суммы, типы (Pro / запись), детали транзакции.',
  },
  {
    to: PLATFORM_ADMIN_NOTIFICATIONS_PATH,
    label: 'Рассылки',
    icon: HiEnvelope,
    title: 'Email-рассылки и доставка',
    description:
      'Подписчики футера, email-рассылки новостей, логи доставки и диагностика Resend/Telegram.',
  },
  {
    to: PLATFORM_ADMIN_AUDIT_PATH,
    label: 'Журнал',
    icon: HiCog6Tooth,
    title: 'Журнал действий',
    description: 'История решений администраторов: кто, что сделал и с какой причиной.',
  },
];

export function getPlatformAdminPageMeta(pathname: string): PlatformAdminNavItem | undefined {
  return PLATFORM_ADMIN_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
}
