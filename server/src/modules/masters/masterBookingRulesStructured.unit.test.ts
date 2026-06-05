import assert from 'node:assert/strict';
import {
  computeCompletionScore,
  validatePutMasterBookingRules,
  buildClientPreviewLines,
  type MasterBookingRulesStructured,
} from './masterBookingRulesStructured.service.js';
import { ApiError } from '../../utils/ApiError.js';

const sample: MasterBookingRulesStructured = {
  minBookingNoticeMinutes: 1440,
  requiresMasterConfirmation: true,
  freeCancelBeforeMinutes: 720,
  lateCancelPolicy: 'mark_late',
  allowedLatenessMinutes: 15,
  lateArrivalPolicy: 'master_can_cancel',
  noShowAfterMinutes: 15,
  noShowPolicy: 'client_can_dispute',
  rescheduleEnabled: true,
  rescheduleBeforeMinutes: 720,
  rescheduleLimit: 2,
  paymentMethods: ['Наличные', 'Карта'],
  preferredBankIds: [],
  paymentComment: 'Оплата после услуги',
  prepaymentRequired: false,
  refundPolicyEnabled: false,
  refundPolicyText: null,
  visitPreparationText: 'Без покрытия',
  contraindicationsText: null,
  completionScore: 0,
  updatedAt: null,
};

function testCompletionScore() {
  const score = computeCompletionScore(sample);
  assert.ok(score > 0);
  assert.ok(score <= 100);
}

function testClientPreview() {
  const lines = buildClientPreviewLines(sample);
  assert.ok(lines.some((l: string) => l.includes('Запись')));
  assert.ok(lines.some((l: string) => l.includes('Отмена')));
  assert.ok(lines.some((l: string) => l.includes('Оплата')));
}

function testValidationNegative() {
  assert.throws(
    () => validatePutMasterBookingRules({ minBookingNoticeMinutes: -1 }),
    (e: unknown) => e instanceof ApiError,
  );
}

function testValidationTextLength() {
  assert.throws(
    () => validatePutMasterBookingRules({ paymentComment: 'x'.repeat(2001) }),
    (e: unknown) => e instanceof ApiError,
  );
}

testCompletionScore();
testClientPreview();
testValidationNegative();
testValidationTextLength();
console.log('masterBookingRulesStructured.unit.test: ok');
