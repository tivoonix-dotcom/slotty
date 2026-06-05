import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Статическая проверка: visit reminders только после confirm; pending — decision jobs. */
function testScheduleModuleExports() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const scheduleSrc = readFileSync(
    join(dir, '../modules/notifications/notificationJobs.schedule.ts'),
    'utf8',
  );
  const processorSrc = readFileSync(
    join(dir, '../modules/notifications/notificationJobs.processor.ts'),
    'utf8',
  );

  const createdBlock = scheduleSrc.slice(
    scheduleSrc.indexOf('scheduleJobsAfterBookingCreated'),
    scheduleSrc.indexOf('cancelPendingReminderJobs'),
  );
  assert.doesNotMatch(createdBlock, /scheduleReminderJobs/);
  assert.match(createdBlock, /schedulePendingDecisionJobs/);
  assert.match(scheduleSrc, /scheduleJobsAfterBookingConfirmed/);
  assert.match(processorSrc, /row.status !== 'confirmed'/);
}

function testCancelPendingIncludesDecisionJobs() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const scheduleSrc = readFileSync(
    join(dir, '../modules/notifications/notificationJobs.schedule.ts'),
    'utf8',
  );
  assert.match(scheduleSrc, /booking_master_pending_reminder/);
  assert.match(scheduleSrc, /booking_master_pending_deadline/);
}

testScheduleModuleExports();
testCancelPendingIncludesDecisionJobs();
console.log('bookingReminderJobs.unit.test: ok');
