import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mapMasterImmediateNotifyKind,
  mapNotificationJobTypeToPreferenceEvent,
} from './masterNotificationPreferences.deliver.js';
import {
  isAlwaysOnMasterNotificationEvent,
  normalizeIncomingPreferences,
} from './masterNotificationPreferences.state.js';

describe('masterNotificationPreferences.deliver maps', () => {
  it('maps job types for master recipient', () => {
    assert.equal(mapNotificationJobTypeToPreferenceEvent('booking_master_new', true), 'new_booking');
    assert.equal(mapNotificationJobTypeToPreferenceEvent('booking_reminder_1h', true), 'reminder_1h');
    assert.equal(mapNotificationJobTypeToPreferenceEvent('booking_master_client_cancelled', true), 'cancel');
  });

  it('maps immediate notify kinds', () => {
    assert.equal(mapMasterImmediateNotifyKind('client_running_late'), 'late');
    assert.equal(mapMasterImmediateNotifyKind('billing'), 'billing');
  });

  it('always_on events cannot be disabled in normalized prefs', () => {
    const n = normalizeIncomingPreferences({
      events: {
        billing: { telegram: false, email: false, inApp: false },
        new_booking: { telegram: false, email: false, inApp: false },
        late: { telegram: false, email: false, inApp: false },
      },
    });
    assert.equal(n.events.billing.telegram, true);
    assert.equal(n.events.new_booking.telegram, true);
    assert.equal(n.events.late.telegram, false);
    assert.equal(isAlwaysOnMasterNotificationEvent('billing'), true);
    assert.equal(isAlwaysOnMasterNotificationEvent('late'), false);
  });
});
