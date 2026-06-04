import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { publicAppUrl } from '../../lib/publicAppUrl.js';
import { getBillingWorkerStatus } from '../billing/billingWorker.js';
import { isResendConfigured } from '../email/emailConfig.js';
import { getGoogleOAuthDiagnostics } from '../auth/googleOAuth.service.js';
import { geoSearch } from '../geo/geo.service.js';
import { getNotificationJobsWorkerStatus } from '../notifications/notificationJobs.worker.js';
import { isBePaidConfigured } from '../payments/bepaid.config.js';
import { callBotMethod, getBotToken } from '../telegram/telegram.botApi.js';
import type { SystemComponentStatus } from './systemStatus.types.js';

export type CheckResult = {
  status: SystemComponentStatus;
  responseTimeMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
};

const AUTOMATED_KEYS = new Set([
  'website',
  'master_cabinet',
  'api',
  'auth',
  'catalog',
  'booking',
  'telegram_bot',
  'email_notifications',
  'payments_bepaid',
  'pro_subscription',
  'maps',
  'database',
  'notification_worker',
  'billing_worker',
]);

const HTTP_PROBE_TIMEOUT_MS = 12_000;

export function isAutomatedComponentKey(key: string): boolean {
  return AUTOMATED_KEYS.has(key);
}

async function probeFrontendPath(path: string): Promise<CheckResult> {
  const url = publicAppUrl(path);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(HTTP_PROBE_TIMEOUT_MS),
    });
    const responseTimeMs = Date.now() - t0;
    const meta = { url, httpStatus: res.status };
    if (res.status >= 500) {
      return {
        status: 'major_outage',
        responseTimeMs,
        errorMessage: `HTTP ${res.status}`,
        metadata: meta,
      };
    }
    if (res.status >= 400) {
      return {
        status: 'degraded',
        responseTimeMs,
        errorMessage: `HTTP ${res.status}`,
        metadata: meta,
      };
    }
    return {
      status: 'operational',
      responseTimeMs,
      errorMessage: null,
      metadata: meta,
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'fetch failed',
      metadata: { url },
    };
  }
}

async function checkDatabase(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await query('select 1 as ok');
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: {},
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'db ping failed',
      metadata: {},
    };
  }
}

async function checkApi(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await query('select count(*)::int from public.system_status_components');
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: {},
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'api/db failed',
      metadata: {},
    };
  }
}

async function checkAuth(): Promise<CheckResult> {
  const google = getGoogleOAuthDiagnostics();
  const telegramOk = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const googleOk = google.configured;
  if (googleOk && telegramOk) {
    return {
      status: 'operational',
      responseTimeMs: null,
      errorMessage: null,
      metadata: { google: true, telegram: true },
    };
  }
  if (googleOk || telegramOk) {
    return {
      status: 'degraded',
      responseTimeMs: null,
      errorMessage: null,
      metadata: { google: googleOk, telegram: telegramOk },
    };
  }
  return {
    status: 'unknown',
    responseTimeMs: null,
    errorMessage: 'OAuth не настроен',
    metadata: { google: false, telegram: false },
  };
}

async function checkTelegramBot(): Promise<CheckResult> {
  const token = getBotToken();
  if (!token) {
    return {
      status: 'unknown',
      responseTimeMs: null,
      errorMessage: 'Бот не настроен',
      metadata: { configured: false },
    };
  }
  const t0 = Date.now();
  const r = await callBotMethod(token, 'getMe', {});
  return {
    status: r.ok ? 'operational' : 'degraded',
    responseTimeMs: Date.now() - t0,
    errorMessage: r.ok ? null : r.error,
    metadata: { configured: true },
  };
}

function checkResend(): CheckResult {
  const ok = isResendConfigured();
  return {
    status: ok ? 'operational' : 'unknown',
    responseTimeMs: null,
    errorMessage: ok ? null : 'Resend не настроен',
    metadata: { configured: ok },
  };
}

function checkBePaid(): CheckResult {
  const ok = isBePaidConfigured();
  return {
    status: ok ? 'operational' : 'unknown',
    responseTimeMs: null,
    errorMessage: ok ? null : 'BePaid не настроен',
    metadata: { configured: ok },
  };
}

function checkNotificationWorker(): CheckResult {
  const w = getNotificationJobsWorkerStatus();
  const meta: Record<string, unknown> = {
    enabled: w.enabled,
    running: w.running,
    lastTickAt: w.lastTickAt,
    lastTickError: w.lastTickError,
    pendingJobs: w.lastReport?.claimed ?? null,
    failedJobs: w.lastReport?.failed ?? null,
  };
  if (!w.enabled) {
    return { status: 'unknown', responseTimeMs: null, errorMessage: 'Worker отключён', metadata: meta };
  }
  if (w.lastTickError) {
    return { status: 'degraded', responseTimeMs: null, errorMessage: w.lastTickError, metadata: meta };
  }
  return { status: 'operational', responseTimeMs: null, errorMessage: null, metadata: meta };
}

function checkBillingWorker(): CheckResult {
  const w = getBillingWorkerStatus();
  const meta: Record<string, unknown> = {
    enabled: w.enabled,
    running: w.running,
    lastTickAt: w.lastTickAt,
    lastTickError: w.lastTickError,
    nextChargeJobs: w.lastReport?.renewalChargesAttempted ?? null,
  };
  if (!w.enabled) {
    return { status: 'unknown', responseTimeMs: null, errorMessage: 'Worker отключён', metadata: meta };
  }
  if (w.lastTickError) {
    return { status: 'degraded', responseTimeMs: null, errorMessage: w.lastTickError, metadata: meta };
  }
  return { status: 'operational', responseTimeMs: null, errorMessage: null, metadata: meta };
}

async function checkCatalog(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const r = await query<{ published: number }>(
      `select count(*)::int as published
         from public.master_profiles
        where publication_status = 'published'`,
    );
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: { publishedMasters: r.rows[0]?.published ?? 0 },
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'catalog query failed',
      metadata: {},
    };
  }
}

async function checkBooking(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const r = await query<{ recent: number }>(
      `select count(*)::int as recent
         from public.appointments
        where created_at >= now() - interval '30 days'`,
    );
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: { appointmentsLast30Days: r.rows[0]?.recent ?? 0 },
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'booking query failed',
      metadata: {},
    };
  }
}

async function checkProSubscription(): Promise<CheckResult> {
  const t0 = Date.now();
  const billingConfigured = isBePaidConfigured();
  try {
    const r = await query<{ plans: number; active: number }>(
      `select
         (select count(*)::int from public.subscription_plans) as plans,
         (select count(*)::int from public.master_subscriptions
           where status = 'active'::public.subscription_status) as active`,
    );
    const plans = r.rows[0]?.plans ?? 0;
    const active = r.rows[0]?.active ?? 0;
    const meta = { billingConfigured, plans, activeSubscriptions: active };
    if (!billingConfigured) {
      return {
        status: 'unknown',
        responseTimeMs: Date.now() - t0,
        errorMessage: 'BePaid не настроен',
        metadata: meta,
      };
    }
    if (plans === 0) {
      return {
        status: 'degraded',
        responseTimeMs: Date.now() - t0,
        errorMessage: 'Тарифные планы не найдены',
        metadata: meta,
      };
    }
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: meta,
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'subscription query failed',
      metadata: { billingConfigured },
    };
  }
}

async function checkMaps(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await query('select count(*)::int as c from public.master_locations');
    const hits = await geoSearch('Минск', 'проспект Независимости');
    const responseTimeMs = Date.now() - t0;
    if (hits.length > 0) {
      return {
        status: 'operational',
        responseTimeMs,
        errorMessage: null,
        metadata: { geocodeHits: hits.length },
      };
    }
    return {
      status: 'degraded',
      responseTimeMs,
      errorMessage: 'Геокодинг не вернул результатов',
      metadata: { geocodeHits: 0 },
    };
  } catch (e) {
    return {
      status: 'degraded',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'maps check failed',
      metadata: {},
    };
  }
}

export async function runComponentCheck(componentKey: string): Promise<CheckResult | null> {
  switch (componentKey) {
    case 'website':
      return probeFrontendPath('/status');
    case 'master_cabinet':
      return probeFrontendPath('/master/settings/security');
    case 'catalog':
      return checkCatalog();
    case 'booking':
      return checkBooking();
    case 'maps':
      return checkMaps();
    case 'database':
      return checkDatabase();
    case 'api':
      return checkApi();
    case 'auth':
      return checkAuth();
    case 'telegram_bot':
      return checkTelegramBot();
    case 'email_notifications':
      return checkResend();
    case 'payments_bepaid':
      return checkBePaid();
    case 'notification_worker':
      return checkNotificationWorker();
    case 'billing_worker':
      return checkBillingWorker();
    case 'pro_subscription':
      return checkProSubscription();
    default:
      return null;
  }
}
