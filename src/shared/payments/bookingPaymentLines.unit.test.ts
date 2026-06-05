import assert from 'node:assert/strict';
import { buildBookingPaymentLines, mergeBookingRuleLines } from './bookingPaymentLines.js';
import { needsPreferredBanks } from './paymentMethodCodes.js';

function testBuildPaymentLines() {
  const lines = buildBookingPaymentLines({
    methods: ['cash', 'card'],
    prepaymentRequired: true,
    preferredBankIds: ['alfabank', 'priorbank'],
    comment: 'Перевод до визита',
  });
  assert.ok(lines.some((l) => l.includes('Оплата:')));
  assert.ok(lines.some((l) => l.includes('Удобные банки:')));
  assert.ok(lines.some((l) => l.includes('Комментарий мастера')));
  assert.ok(!lines.some((l) => l.includes('Предоплата')));
}

function testMergeReplacesDuplicatePaymentPreview() {
  const merged = mergeBookingRuleLines(
    ['Запись: минимум за 2 ч', 'Оплата: Наличные'],
    {
      methods: ['card'],
      prepaymentRequired: false,
      preferredBankIds: [],
      comment: null,
    },
  );
  assert.equal(merged.filter((l) => l.startsWith('Оплата:')).length, 1);
  assert.ok(merged.some((l) => l.includes('Карта')));
}

function testNeedsPreferredBanksUi() {
  assert.equal(needsPreferredBanks(['Наличные']), false);
  assert.equal(needsPreferredBanks(['Карта']), true);
}

testBuildPaymentLines();
testMergeReplacesDuplicatePaymentPreview();
testNeedsPreferredBanksUi();
console.log('bookingPaymentLines.unit.test: ok');
