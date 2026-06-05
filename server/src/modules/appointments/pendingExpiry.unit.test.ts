import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const dir = dirname(fileURLToPath(import.meta.url));

describe('pendingExpiry lifecycle guards', () => {
  it('expire service sets expired and releases slot', () => {
    const src = readFileSync(join(dir, 'pendingExpiry.service.ts'), 'utf8');
    assert.match(src, /status = 'expired'/);
    assert.match(src, /status = 'available'/);
    assert.match(src, /notifyClientByAppointmentId\(appointmentId, 'expired'\)/);
  });

  it('master confirm rejects expired and past deadline', () => {
    const src = readFileSync(join(dir, 'appointments.lifecycle.ts'), 'utf8');
    assert.match(src, /assertPendingCanBeConfirmed/);
    assert.match(src, /BOOKING_EXPIRED/);
  });

  it('master complete rejects expired and completes directly', () => {
    const src = readFileSync(join(dir, 'appointments.completion.service.ts'), 'utf8');
    const masterComplete = src.slice(
      src.indexOf('export async function masterMarkServiceCompleted'),
      src.indexOf('export async function clientConfirmServiceCompleted'),
    );
    assert.match(masterComplete, /s === 'expired'/);
    assert.match(masterComplete, /finalizeAppointmentCompleted/);
    assert.match(masterComplete, /eventType: 'booking\.completed_by_master'/);
    assert.doesNotMatch(masterComplete, /newStatus: 'master_marked_completed'/);
  });

  it('deprecated master marked completed notification redirects to completed', () => {
    const src = readFileSync(join(dir, 'appointments.clientNotifications.ts'), 'utf8');
    assert.match(src, /notifyClientBookingCompleted\(ctx\)/);
  });
});

describe('notification schedule after create', () => {
  it('does not schedule visit reminders on create', () => {
    const src = readFileSync(join(dir, '../notifications/notificationJobs.schedule.ts'), 'utf8');
    const createFn = src.slice(
      src.indexOf('export async function scheduleJobsAfterBookingCreated'),
      src.indexOf('export async function cancelPendingReminderJobs'),
    );
    assert.doesNotMatch(createFn, /scheduleReminderJobs/);
    assert.match(createFn, /schedulePendingDecisionJobs/);
  });

  it('schedules visit reminders only after confirm', () => {
    const src = readFileSync(join(dir, '../notifications/notificationJobs.schedule.ts'), 'utf8');
    const confirmFn = src.slice(
      src.indexOf('export async function scheduleJobsAfterBookingConfirmed'),
      src.indexOf('export async function scheduleJobsAfterBookingCancelled'),
    );
    assert.match(confirmFn, /scheduleReminderJobs/);
    assert.match(confirmFn, /cancelPendingReminderJobs/);
  });

  it('reminder processor requires confirmed status', () => {
    const src = readFileSync(join(dir, '../notifications/notificationJobs.processor.ts'), 'utf8');
    assert.match(src, /row.status !== 'confirmed'/);
  });
});
