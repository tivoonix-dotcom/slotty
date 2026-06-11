import {
  MASTER_SETTINGS_SUPPORT_CONTACT_PATH,
  MASTER_SETTINGS_SUPPORT_DOCS_PATH,
  MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
} from '../../../../../app/paths';

export type SupportOptionId =
  | 'assistant'
  | 'docs'
  | 'contact'
  | 'community';

export type SupportOption = {
  id: SupportOptionId;
  title: string;
  description: string;
  actionLabel: string;
  to?: string;
  externalHref?: string;
  badge?: string;
  disabled?: boolean;
};

export const SUPPORT_OPTIONS: SupportOption[] = [
  {
    id: 'assistant',
    title: 'SLOTTY Assistant',
    description: 'Получите быструю помощь по настройке профиля, записям, оплате и уведомлениям.',
    actionLabel: 'Открыть ассистента',
    badge: 'Скоро',
    disabled: true,
  },
  {
    id: 'docs',
    title: 'Документация',
    description: 'Гайды по профилю мастера, услугам, расписанию, записям и тарифам.',
    actionLabel: 'Открыть документацию',
    to: MASTER_SETTINGS_SUPPORT_DOCS_PATH,
  },
  {
    id: 'contact',
    title: 'Связаться с поддержкой',
    description: 'Отправьте обращение по аккаунту, оплате, записям или технической проблеме.',
    actionLabel: 'Создать обращение',
    to: MASTER_SETTINGS_SUPPORT_CONTACT_PATH,
  },
  {
    id: 'community',
    title: 'Сообщество SLOTTY',
    description: 'Задайте вопрос, поделитесь идеей или найдите ответ в сообществе.',
    actionLabel: 'Открыть Telegram',
    badge: 'Скоро',
    disabled: true,
  },
];

export const SUPPORT_CATEGORY_OPTIONS = [
  { value: 'account_login', label: 'Аккаунт и вход' },
  { value: 'master_profile', label: 'Профиль мастера' },
  { value: 'services', label: 'Услуги' },
  { value: 'schedule', label: 'Расписание' },
  { value: 'appointments', label: 'Записи' },
  { value: 'notifications', label: 'Уведомления' },
  { value: 'billing_plan', label: 'Тариф и оплата' },
  { value: 'payment_bepaid', label: 'Оплата BePaid' },
  { value: 'integrations', label: 'Интеграции' },
  { value: 'map_address', label: 'Карта / адрес' },
  { value: 'ui_bug', label: 'Ошибка интерфейса' },
  { value: 'other', label: 'Другое' },
] as const;

export const SUPPORT_SEVERITY_OPTIONS = [
  { value: 'low', label: 'Низкая — вопрос или предложение' },
  { value: 'medium', label: 'Средняя — мешает работе, но есть обходной путь' },
  { value: 'high', label: 'Высокая — не могу принимать записи / проблема с оплатой' },
  { value: 'critical', label: 'Критическая — потеря доступа / деньги / массовая ошибка' },
] as const;

export const SUPPORT_AFFECTED_SERVICE_OPTIONS = [
  { value: 'web_cabinet', label: 'Веб-кабинет' },
  { value: 'telegram_bot', label: 'Telegram bot' },
  { value: 'email_notifications', label: 'Email уведомления' },
  { value: 'payments', label: 'Оплата' },
  { value: 'map_address', label: 'Карта/адреса' },
  { value: 'catalog', label: 'Каталог' },
  { value: 'appointments', label: 'Записи' },
  { value: 'pro_subscription', label: 'Подписка Pro' },
  { value: 'unknown', label: 'Не знаю' },
] as const;

export const SUPPORT_CONTACT_CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'in_app', label: 'В приложении' },
] as const;

/** Фон блока «Нужна срочная помощь?» (`public/photos/urgent-help/1.webp`). */
export const SUPPORT_URGENT_HELP_BG = '/photos/urgent-help/1.webp';

export const SUPPORT_DRAFT_STORAGE_KEY = 'slotty:support-contact-draft';
export const SUPPORT_MESSAGE_MAX = 5000;

export const SUPPORT_TICKETS_LIST_PATH = MASTER_SETTINGS_SUPPORT_TICKETS_PATH;
