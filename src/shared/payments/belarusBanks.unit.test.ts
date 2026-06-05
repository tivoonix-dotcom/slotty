import assert from 'node:assert/strict';
import {
  BELARUS_BANKS,
  BELARUS_BANK_IDS,
  filterValidBankIds,
  getBelarusBankById,
  resolveBelarusBanks,
} from './belarusBanks.js';

function testNoDuplicateIds() {
  const ids = BELARUS_BANKS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
}

function testAllLogosHavePaths() {
  for (const bank of BELARUS_BANKS) {
    assert.ok(bank.logoSrc.startsWith('/photos/banks/'), bank.id);
    assert.ok(bank.name.trim().length > 0, bank.id);
  }
}

function testFilterValidBankIds() {
  assert.deepEqual(filterValidBankIds(['alfabank', 'unknown', 'alfabank']), ['alfabank']);
  assert.deepEqual(filterValidBankIds([]), []);
}

function testResolveBanks() {
  const banks = resolveBelarusBanks(['priorbank', 'fake', 'priorbank', 'mtbank']);
  assert.equal(banks.length, 2);
  assert.equal(banks[0]?.id, 'priorbank');
  assert.equal(banks[1]?.id, 'mtbank');
}

function testGetById() {
  assert.equal(getBelarusBankById('sber')?.name, 'Сбер Банк');
  assert.equal(getBelarusBankById('nope'), undefined);
}

function testPopularCount() {
  const popular = BELARUS_BANKS.filter((b) => b.popular);
  assert.equal(popular.length, 10);
  for (const bank of popular) {
    assert.ok(BELARUS_BANK_IDS.has(bank.id));
  }
}

testNoDuplicateIds();
testAllLogosHavePaths();
testFilterValidBankIds();
testResolveBanks();
testGetById();
testPopularCount();
console.log('belarusBanks.unit.test: ok');
