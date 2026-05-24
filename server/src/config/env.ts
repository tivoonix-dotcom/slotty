import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(configDir, '../..');
const repoRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config({ path: path.join(repoRoot, '.env') });

function envFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

if (!process.env.SUPABASE_URL) {
  const url = envFirst('SUPABASE_URL', 'VITE_SUPABASE_URL');
  if (url) process.env.SUPABASE_URL = url;
}
if (!process.env.GOOGLE_CLIENT_ID) {
  const id = envFirst('GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID');
  if (id) process.env.GOOGLE_CLIENT_ID = id;
}
if (!process.env.DATABASE_URL) {
  const db = envFirst('DATABASE_URL');
  if (db) process.env.DATABASE_URL = db;
}
if (!process.env.JWT_SECRET) {
  const jwt = envFirst('JWT_SECRET');
  if (jwt) process.env.JWT_SECRET = jwt;
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const key = envFirst('SUPABASE_SERVICE_ROLE_KEY');
  if (key) process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  TELEGRAM_BOT_TOKEN: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  /** Имя бота без @ — для публичных ссылок t.me (если не задано, берётся из getMe). */
  TELEGRAM_BOT_USERNAME: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim().replace(/^@+/, '')),
    z.string().min(3).max(64).regex(/^[a-zA-Z0-9_]+$/).optional(),
  ),
  /** Google OAuth client id (Web) — same value as VITE_GOOGLE_CLIENT_ID on frontend. */
  GOOGLE_CLIENT_ID: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  /** OAuth Web client secret — для входа/привязки Google из Telegram (redirect flow). */
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  /** HTTPS URL мини-приложения (ngrok / Cloudflare Tunnel / прод). Для `npm run telegram:setup`. */
  WEB_APP_URL: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().url().optional(),
  ),
  /** Полный HTTPS URL вебхука бэкенда, например `https://api.example.com/api/telegram/webhook`. Для `npm run telegram:setup`. */
  TELEGRAM_WEBHOOK_URL: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().url().optional(),
  ),
  /** Секрет для заголовка `X-Telegram-Bot-Api-Secret-Token` (до 256 символов). Должен совпадать с `secret_token` в setWebhook. */
  TELEGRAM_WEBHOOK_SECRET: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).max(256).optional(),
  ),
  /** В production: разрешить PATCH .../subscription/mock (только при `true`). В dev/test mock включён по NODE_ENV. */
  ALLOW_SUBSCRIPTION_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  /** Supabase project URL (для загрузки аватаров в Storage с сервера). */
  SUPABASE_URL: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().url().optional(),
  ),
  /** Service role — только на сервере, не в браузере. */
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  /** Имя публичного bucket для аватаров клиентов (по умолчанию `profile`). */
  SUPABASE_PROFILE_BUCKET: z.string().min(1).default('profile'),
  /** Bucket для фото мастера (портфолио, сертификаты, обложка). Пусто — тот же, что SUPABASE_PROFILE_BUCKET. */
  SUPABASE_MASTER_MEDIA_BUCKET: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  /** Планировщик напоминаний о записи (за 24ч и 1ч). По умолчанию включён. */
  APPOINTMENT_REMINDERS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0'),
  /** Интервал проверки напоминаний, мс (по умолчанию 5 мин). */
  APPOINTMENT_REMINDERS_INTERVAL_MS: z.coerce.number().int().min(60_000).max(3_600_000).default(300_000),
  /** Resend API key; без ключа в dev письма логируются в консоль. */
  RESEND_API_KEY: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(1).optional(),
  ),
  /** Отправитель, например `SLOTTY <noreply@slotty.of.by>`. */
  RESEND_FROM: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().min(3).optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  console.error(
    '\nЛокально: скопируйте server/.env.example → server/.env и заполните DATABASE_URL, JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Корневой .env (VITE_*) подхватывается автоматически для SUPABASE_URL и GOOGLE_CLIENT_ID.\n',
  );
  process.exit(1);
}

export const env = parsed.data;
