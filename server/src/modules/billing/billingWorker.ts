import { env } from '../../config/env.js';
import { processBillingJobsBatch, type BillingWorkerTickReport } from './billingJobs.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastTickAt: string | null = null;
let lastTickError: string | null = null;
let lastReport: BillingWorkerTickReport | null = null;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const report = await processBillingJobsBatch(25);
    lastTickAt = new Date().toISOString();
    lastTickError = null;
    lastReport = report;
    if (report.renewalChargesAttempted > 0 || report.remindersSent > 0 || report.errors.length > 0) {
      console.info('[billing-worker] tick', {
        renewals: report.renewalChargesAttempted,
        ok: report.renewalChargesSucceeded,
        fail: report.renewalChargesFailed,
        reminders: report.remindersSent,
        errors: report.errors.length,
      });
    }
  } catch (e) {
    lastTickError = e instanceof Error ? e.message : String(e);
    console.warn('[billing-worker] tick failed', lastTickError);
  } finally {
    running = false;
  }
}

export function startBillingWorker(): void {
  if (!env.BILLING_WORKER_ENABLED) {
    console.log('[billing-worker] disabled (BILLING_WORKER_ENABLED=false)');
    return;
  }
  const intervalMs = env.BILLING_WORKER_INTERVAL_MS;
  console.log(`[billing-worker] started, interval ${Math.round(intervalMs / 1000)}s`);
  void tick();
  timer = setInterval(() => void tick(), intervalMs);
}

export function getBillingWorkerStatus(): {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  lastTickAt: string | null;
  lastTickError: string | null;
  lastReport: BillingWorkerTickReport | null;
} {
  return {
    enabled: env.BILLING_WORKER_ENABLED,
    running: timer != null,
    intervalMs: env.BILLING_WORKER_INTERVAL_MS,
    lastTickAt,
    lastTickError,
    lastReport,
  };
}
