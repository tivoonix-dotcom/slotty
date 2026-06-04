import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultMasterNotificationPreferences,
  normalizeIncomingPreferences,
} from './masterNotificationPreferences.state.js';

describe('masterNotificationPreferences.state', () => {
  it('defaults include all event keys', () => {
    const d = defaultMasterNotificationPreferences();
    assert.equal(d.events.new_booking.telegram, true);
    assert.equal(d.events.news.telegram, false);
    assert.equal(d.channels.in_app, true);
  });

  it('normalizes partial payload', () => {
    const n = normalizeIncomingPreferences({
      channels: { telegram: false, email: true, in_app: true },
      events: { cancel: { telegram: false, email: true, inApp: false } },
    });
    assert.equal(n.channels.telegram, false);
    assert.equal(n.events.cancel.telegram, false);
    assert.equal(n.events.cancel.inApp, false);
    assert.equal(n.events.new_booking.telegram, true);
  });
});
