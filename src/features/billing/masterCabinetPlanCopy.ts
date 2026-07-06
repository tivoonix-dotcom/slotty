import { getPlanLimits } from './model/masterPlans';

const FREE_MAX_ACTIVE = getPlanLimits('free').maxServices ?? 3;

/** Тексты тарифа Free/Pro в мастер-кабинете (после регистрации). */
export const CABINET_PLAN_COPY = {
  freeTitle: 'Вы на бесплатном тарифе',
  freeBody:
    'Можно принимать записи и пользоваться базовыми функциями бесплатно. На Free — до 3 активных услуг одновременно.',
  freeActiveServices: (active: number, max: number = FREE_MAX_ACTIVE) =>
    `Активные услуги: ${active} из ${max}`,
  freeLimitReached: (max: number = FREE_MAX_ACTIVE) =>
    `Вы использовали лимит бесплатного тарифа (${max} активных услуг). Чтобы добавить больше, подключите Pro.`,
  freeInactiveServices: (inactive: number) =>
    inactive === 1
      ? 'У вас есть 1 неактивная услуга. Чтобы опубликовать её, подключите Pro или оставьте до 3 активных на Free.'
      : `У вас ${inactive} неактивных услуг. Чтобы опубликовать их все, подключите Pro.`,
  connectPro: 'Подключить Pro',
  manageServices: 'Управлять услугами',
  proTitle: 'Тариф Pro активен',
  proBody: 'Доступны расширенные возможности: больше активных услуг, наборы, акции и аналитика.',
  proActiveUntil: (label: string) => `Подписка активна до ${label}`,
  proTrialUntil: (label: string) => `Пробный период Pro до ${label}`,
  loading: 'Загружаем информацию о тарифе…',
} as const;
