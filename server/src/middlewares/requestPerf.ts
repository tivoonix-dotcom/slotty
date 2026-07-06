import type { NextFunction, Request, Response } from 'express';

const SLOW_MS = Number(process.env.PERF_SLOW_REQUEST_MS ?? 1500);

const ONBOARDING_BILLING_PATH_RE =
  /\/onboarding|\/onboarding-progress|\/billing\/(checkout|subscription|payments)|\/auth\/me/;

function pathLabel(req: Request): string {
  const base = req.baseUrl || '';
  const path = req.route?.path ? String(req.route.path) : req.path;
  return `${base}${path}` || req.originalUrl.split('?')[0] || req.path;
}

function isOnboardingBillingPath(label: string): boolean {
  return ONBOARDING_BILLING_PATH_RE.test(label);
}

/** Production-safe request timing: логирует медленные запросы, 5xx и onboarding/billing. */
export function requestPerfMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const status = res.statusCode;
    const label = pathLabel(req);
    const shouldLog = elapsedMs >= SLOW_MS || status >= 500 || isOnboardingBillingPath(label);
    if (!shouldLog) return;

    const requestId = req.requestId ?? '-';
    const role = req.user?.role ?? 'anon';
    const size = res.getHeader('content-length');
    const sizeKb = typeof size === 'string' ? Math.round(Number(size) / 1024) : undefined;
    const tag = isOnboardingBillingPath(label) ? ' onboarding' : '';

    console.info(
      `[perf]${tag} requestId=${requestId} method=${req.method} path=${label} status=${status} total=${Math.round(elapsedMs)}ms role=${role}${sizeKb != null && Number.isFinite(sizeKb) ? ` size=${sizeKb}kb` : ''}`,
    );
  });

  next();
}
