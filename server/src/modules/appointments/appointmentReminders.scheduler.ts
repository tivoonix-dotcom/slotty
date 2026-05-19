import { env } from '../../config/env.js';
import { processAppointmentReminders } from './appointmentReminders.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const report = await processAppointmentReminders();
    if (report.sent24h > 0 || report.sent1h > 0) {
      console.log(
        `[reminders] sent 24h=${report.sent24h} 1h=${report.sent1h} (${report.durationMs}ms)`,
      );
    }
  } catch (e) {
    console.warn('[reminders] tick failed:', e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

/** Периодическая проверка записей и отправка напоминаний в Telegram + in-app. */
export function startAppointmentRemindersScheduler(): void {
  if (!env.APPOINTMENT_REMINDERS_ENABLED) {
    console.log('[reminders] scheduler disabled (APPOINTMENT_REMINDERS_ENABLED=false)');
    return;
  }

  const intervalMs = env.APPOINTMENT_REMINDERS_INTERVAL_MS;
  console.log(`[reminders] scheduler started, interval ${Math.round(intervalMs / 1000)}s`);

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopAppointmentRemindersScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
