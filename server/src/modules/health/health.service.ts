import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { getAppointmentRemindersSchedulerStatus } from '../appointments/appointmentReminders.scheduler.js';
import { getNotificationJobsWorkerStatus } from '../notifications/notificationJobs.worker.js';
import { getBillingWorkerStatus } from '../billing/billingWorker.js';
import { isResendConfigured, resolveResendFrom } from '../email/emailConfig.js';

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../supabase/migrations_v2',
);

function listExpectedMigrationFiles(): string[] {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_.+\.sql$/i.test(f))
    .sort();
}

export async function getMigrationsHealth(): Promise<{
  ok: boolean;
  applied: number;
  expected: number;
  pending: string[];
}> {
  const expected = listExpectedMigrationFiles();
  const r = await query<{ filename: string }>(
    `select filename from public.schema_migrations_v2 order by filename`,
  );
  const appliedSet = new Set(r.rows.map((row) => row.filename));
  const pending = expected.filter((f) => !appliedSet.has(f));
  return {
    ok: pending.length === 0,
    applied: appliedSet.size,
    expected: expected.length,
    pending,
  };
}

export function getRuntimeHealth() {
  return {
    nodeEnv: env.NODE_ENV,
    googleLinkHandoffStore: env.GOOGLE_LINK_HANDOFF_STORE,
    apiReplicaCount: env.API_REPLICA_COUNT,
    redisConfigured: Boolean(env.REDIS_URL?.trim()),
    sentryConfigured: Boolean(env.SENTRY_DSN?.trim()),
    reminders: getAppointmentRemindersSchedulerStatus(),
    notificationJobs: getNotificationJobsWorkerStatus(),
    billingWorker: getBillingWorkerStatus(),
    resendConfigured: isResendConfigured(),
    resendFrom: resolveResendFrom(),
  };
}
