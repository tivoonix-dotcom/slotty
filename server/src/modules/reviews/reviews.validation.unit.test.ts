import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canClientLeaveReview } from '../../lib/appointmentStatus.js';

describe('review eligibility (status)', () => {
  it('completed without dispute → can leave review', () => {
    assert.equal(canClientLeaveReview('completed', false), true);
  });

  it('completed with open dispute → cannot', () => {
    assert.equal(canClientLeaveReview('completed', true), false);
  });

  it('pending → cannot', () => {
    assert.equal(canClientLeaveReview('pending', false), false);
  });

  it('cancelled → cannot', () => {
    assert.equal(canClientLeaveReview('cancelled_by_client', false), false);
  });

  it('no_show → cannot', () => {
    assert.equal(canClientLeaveReview('no_show', false), false);
  });
});
