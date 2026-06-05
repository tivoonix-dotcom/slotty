import { env } from '../../config/env.js';
import { expireDuePendingAppointments } from './pendingExpiry.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const report = await expireDuePendingAppointments(40);
    if (report.expired > 0) {
      console.log(`[pending-expiry] expired ${report.expired} in ${report.durationMs}ms`);
    }
  } catch (e) {
    console.warn('[pending-expiry] tick failed:', e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

export function startPendingExpiryWorker(): void {
  if (!env.NOTIFICATION_JOBS_ENABLED) {
    console.log('[pending-expiry] worker disabled (NOTIFICATION_JOBS_ENABLED=false)');
    return;
  }

  const intervalMs = Math.max(60_000, env.NOTIFICATION_JOBS_INTERVAL_MS);
  console.log(`[pending-expiry] worker started, interval ${Math.round(intervalMs / 1000)}s`);
  void tick();
  timer = setInterval(() => void tick(), intervalMs);
}

export function stopPendingExpiryWorker(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
