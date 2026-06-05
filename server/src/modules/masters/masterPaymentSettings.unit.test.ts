import assert from 'node:assert/strict';
import {
  filterValidBankIds,
  needsPreferredBanks,
  paymentCodesToLabels,
  paymentLabelsToCodes,
  sanitizePreferredBankIds,
} from '../../lib/belarusBanks.js';
import { validatePatchPaymentSettings } from '../masters/masterPaymentSettings.service.js';
import { ApiError } from '../../utils/ApiError.js';

function testPaymentLabelCodeRoundtrip() {
  const labels = ['Наличные', 'Карта', 'Перевод'];
  const codes = paymentLabelsToCodes(labels);
  assert.deepEqual(codes, ['cash', 'card', 'transfer']);
  assert.deepEqual(paymentCodesToLabels(codes), labels);
}

function testSanitizeBanksClearsWithoutCardTransfer() {
  assert.deepEqual(sanitizePreferredBankIds(['cash'], ['alfabank', 'priorbank']), []);
  assert.deepEqual(sanitizePreferredBankIds(['online_later'], ['alfabank']), []);
}

function testSanitizeBanksKeepsForCardOrTransfer() {
  assert.deepEqual(sanitizePreferredBankIds(['card'], ['alfabank', 'fake']), ['alfabank']);
  assert.deepEqual(sanitizePreferredBankIds(['transfer'], ['mtbank']), ['mtbank']);
  assert.deepEqual(sanitizePreferredBankIds(['card', 'transfer'], ['sber', 'sber']), ['sber']);
}

function testNeedsPreferredBanks() {
  assert.equal(needsPreferredBanks(['cash']), false);
  assert.equal(needsPreferredBanks(['card']), true);
  assert.equal(needsPreferredBanks(['transfer']), true);
  assert.equal(needsPreferredBanks(['cash', 'card']), true);
}

function testFilterValidBankIds() {
  assert.deepEqual(filterValidBankIds(['alfabank', 'nope', 'alfabank']), ['alfabank']);
}

function testValidateUnknownBank() {
  assert.throws(
    () => validatePatchPaymentSettings({ preferredBankIds: ['bad-bank'] }),
    (e: unknown) => e instanceof ApiError,
  );
}

function testValidateUnknownPaymentMethod() {
  assert.throws(
    () => validatePatchPaymentSettings({ paymentMethods: ['crypto' as never] }),
    (e: unknown) => e instanceof ApiError,
  );
}

testPaymentLabelCodeRoundtrip();
testSanitizeBanksClearsWithoutCardTransfer();
testSanitizeBanksKeepsForCardOrTransfer();
testNeedsPreferredBanks();
testFilterValidBankIds();
testValidateUnknownBank();
testValidateUnknownPaymentMethod();
console.log('masterPaymentSettings.unit.test: ok');
