/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** SLOTTY Node backend (no trailing slash), e.g. http://localhost:4000 */
  readonly VITE_API_URL?: string;
  /** 'true' — не мокать Telegram на localhost (для отладки ошибок окружения) */
  readonly VITE_DISABLE_TELEGRAM_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
