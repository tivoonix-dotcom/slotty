/**
 * Проверка подписи initData выполняется только на сервере (Supabase Edge Function),
 * используя токен бота. В клиентском коде достаточно передать `initDataRaw` в Edge Function.
 */
export async function requestTelegramAuth(_initDataRaw: string): Promise<void> {
  throw new Error('Реализуйте вызов Edge Function `validate-telegram`');
}
