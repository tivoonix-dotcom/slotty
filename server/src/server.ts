import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSentry } from './lib/sentry.js';
import { getGoogleOAuthDiagnostics } from './modules/auth/googleOAuth.service.js';
import { startAppointmentRemindersScheduler } from './modules/appointments/appointmentReminders.scheduler.js';
import { startNotificationJobsWorker } from './modules/notifications/notificationJobs.worker.js';
import { startBookingAutoCompleteWorker } from './modules/appointments/bookingAutoComplete.worker.js';
import { startPendingExpiryWorker } from './modules/appointments/pendingExpiry.worker.js';
import { startBillingWorker } from './modules/billing/billingWorker.js';
import { startSystemStatusWorker } from './modules/system-status/systemStatus.worker.js';
import { initTelegramBotTransport } from './modules/telegram/telegram.service.js';
import { logResendConfigStatus } from './modules/email/emailConfig.js';
import { logBePaidConfigStatus } from './modules/payments/bepaid.config.js';
import { logAuthSessionsTableStatus } from './modules/auth/authSessions.service.js';
import { startDataExportWorker } from './modules/data-export/dataExport.worker.js';

initSentry();
const app = createApp();

process.on('unhandledRejection', (reason) => {
  console.error('[api] unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[api] uncaughtException:', err);
});

app.listen(env.PORT, () => {
  // Do not log secrets (DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN).
  console.log(`slotty-backend listening on port ${env.PORT}`);
  const googleOAuth = getGoogleOAuthDiagnostics();
  if (env.GOOGLE_CLIENT_ID && !googleOAuth.configured) {
    console.warn(
      `[auth] Google OAuth redirect не готов: ${googleOAuth.missing.join(', ')}. ` +
        'Привязка Google из Telegram не будет работать до настройки env на API-сервисе.',
    );
  } else if (googleOAuth.configured && googleOAuth.redirectUri) {
    console.log(`[auth] Google OAuth redirect → ${googleOAuth.redirectUri}`);
  }
  logResendConfigStatus();
  logBePaidConfigStatus();
  void logAuthSessionsTableStatus();
  void initTelegramBotTransport();
  startNotificationJobsWorker();
  startPendingExpiryWorker();
  startBookingAutoCompleteWorker();
  startAppointmentRemindersScheduler();
  startBillingWorker();
  startSystemStatusWorker();
  startDataExportWorker();
  void import('./modules/auth/googleLoginPending.store.js').then(({ warnIfPendingStoreNotShared }) => {
    warnIfPendingStoreNotShared();
  });
});
