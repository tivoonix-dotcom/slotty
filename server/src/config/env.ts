import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  /** HTTPS URL мини-приложения (ngrok / Cloudflare Tunnel / прод). Для `npm run telegram:setup`. */
  WEB_APP_URL: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : String(v).trim()),
    z.string().url().optional(),
  ),
  /** В production: разрешить PATCH .../subscription/mock (только при `true`). В dev/test mock включён по NODE_ENV. */
  ALLOW_SUBSCRIPTION_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  /** Supabase project URL (для загрузки аватаров в Storage с сервера). */
  SUPABASE_URL: z.string().url().optional(),
  /** Service role — только на сервере, не в браузере. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  /** Имя публичного bucket для аватаров клиентов (по умолчанию `profile`). */
  SUPABASE_PROFILE_BUCKET: z.string().min(1).default('profile'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
