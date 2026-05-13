/**
 * Демо-профиль клиента для экрана «Мой профиль».
 * TODO (Supabase): users / profiles по telegram_id.
 */

export type DemoProfileUser = {
  displayName: string;
  subtitle: string;
  /** Первая буква для аватара-круга */
  initial: string;
  telegramLabel: string;
};

export const DEMO_PROFILE_USER: DemoProfileUser = {
  displayName: 'Данила',
  subtitle: 'Клиент SLOTTY',
  initial: 'Д',
  telegramLabel: 'Telegram',
};
