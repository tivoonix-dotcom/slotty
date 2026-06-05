import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildBookingSearchSql,
  parseBookingSearchQuery,
} from './platformAdminBookingsSearch.js';

describe('parseBookingSearchQuery', () => {
  it('returns none for empty input', () => {
    assert.deepEqual(parseBookingSearchQuery(''), { type: 'none' });
    assert.deepEqual(parseBookingSearchQuery('   '), { type: 'none' });
  });

  it('parses exact voucher with trim and lowercase', () => {
    assert.deepEqual(parseBookingSearchQuery('  sl-abc123456789  '), {
      type: 'voucher_exact',
      value: 'SL-ABC123456789',
    });
  });

  it('parses voucher prefix', () => {
    assert.deepEqual(parseBookingSearchQuery('SL-ABC'), {
      type: 'voucher_prefix',
      value: 'SL-ABC',
    });
  });

  it('parses uuid', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    assert.deepEqual(parseBookingSearchQuery(id), { type: 'uuid', value: id });
  });

  it('falls back to text for regular names', () => {
    assert.deepEqual(parseBookingSearchQuery('Анна'), { type: 'text', value: 'Анна' });
    assert.deepEqual(parseBookingSearchQuery('Маникюр'), { type: 'text', value: 'Маникюр' });
  });
});

describe('buildBookingSearchSql', () => {
  it('builds exact voucher condition and sort priority', () => {
    const vals: unknown[] = [];
    const built = buildBookingSearchSql(
      { type: 'voucher_exact', value: 'SL-ABC123456789' },
      vals,
      1,
    );
    assert.match(built.condition ?? '', /bv\.voucher_number = \$1/);
    assert.match(built.orderBy, /case when bv\.voucher_number = \$1/);
    assert.equal(vals[0], 'SL-ABC123456789');
    assert.equal(built.needsVoucherJoin, true);
  });

  it('builds prefix voucher ilike', () => {
    const vals: unknown[] = [];
    const built = buildBookingSearchSql({ type: 'voucher_prefix', value: 'SL-ABC' }, vals, 2);
    assert.match(built.condition ?? '', /ilike \$2/);
    assert.equal(vals[0], 'SL-ABC%');
  });

  it('builds text search across client, master, service, voucher', () => {
    const vals: unknown[] = [];
    const built = buildBookingSearchSql({ type: 'text', value: 'Anna' }, vals, 1);
    assert.match(built.condition ?? '', /cp\.full_name ilike \$1/);
    assert.match(built.condition ?? '', /mp\.display_name ilike \$1/);
    assert.match(built.condition ?? '', /bv\.voucher_number ilike \$1/);
    assert.deepEqual(vals, ['%Anna%', 'Anna']);
  });
});
