import type { CorsOptions } from 'cors';
import { env } from './env.js';

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

const STATIC_ALLOWED_ORIGINS = [
  'https://slotty.of.by',
  'https://www.slotty.of.by',
  'https://slotty-production.up.railway.app',
] as const;

export const allowedOrigins: string[] = [
  ...new Set(
    [
      ...STATIC_ALLOWED_ORIGINS,
      env.CLIENT_URL,
      env.WEB_APP_URL,
    ]
      .filter((v): v is string => Boolean(v?.trim()))
      .map(normalizeOrigin),
  ),
];

function isLocalDevOrigin(origin: string): boolean {
  if (env.NODE_ENV === 'production') return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized) || isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
};
