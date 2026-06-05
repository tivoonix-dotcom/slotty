import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPendingDeadline } from './formatPendingDeadline';

describe('formatPendingDeadline', () => {
  it('returns null without deadline', () => {
    assert.equal(formatPendingDeadline(null), null);
  });

  it('shows confirm until time', () => {
    const expires = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
    const view = formatPendingDeadline(expires);
    assert.ok(view);
    assert.match(view!.line, /Подтвердите до/);
    assert.equal(view!.confirmDisabled, false);
  });

  it('warns when less than an hour left', () => {
    const expires = new Date(Date.now() + 40 * 60_000).toISOString();
    const view = formatPendingDeadline(expires);
    assert.ok(view);
    assert.equal(view!.line, 'Заявка скоро истечёт');
    assert.equal(view!.tone, 'warning');
  });

  it('warns when less than 15 minutes left', () => {
    const expires = new Date(Date.now() + 10 * 60_000).toISOString();
    const view = formatPendingDeadline(expires);
    assert.ok(view);
    assert.match(view!.line, /Осталось/);
    assert.equal(view!.tone, 'warning');
  });

  it('disables confirm when deadline passed', () => {
    const expires = new Date(Date.now() - 60_000).toISOString();
    const view = formatPendingDeadline(expires);
    assert.ok(view);
    assert.equal(view!.line, 'Заявка истекает');
    assert.equal(view!.confirmDisabled, true);
  });
});
