import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CABINET_PLAN_COPY } from './masterCabinetPlanCopy';

describe('masterCabinetPlanCopy', () => {
  it('freeActiveServices formats counter', () => {
    assert.equal(CABINET_PLAN_COPY.freeActiveServices(2, 3), 'Активные услуги: 2 из 3');
  });

  it('freeLimitReached mentions Pro', () => {
    assert.match(CABINET_PLAN_COPY.freeLimitReached(3), /Pro/);
  });

  it('proTitle for entitled masters', () => {
    assert.match(CABINET_PLAN_COPY.proTitle, /Pro активен/);
  });
});
