/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** SLOTTY Node backend (no trailing slash), e.g. http://localhost:4000 */
  readonly VITE_API_URL?: string;
  /** 'true' — не мокать Telegram на localhost (для отладки ошибок окружения) */
  readonly VITE_DISABLE_TELEGRAM_MOCK?: string;
  /** Имя Telegram-бота без @ (ссылки вида https://t.me/BOT?start=master_…) */
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  /** Публичный URL фронта для ссылок клиентам (например https://slotty.of.by). */
  readonly VITE_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
