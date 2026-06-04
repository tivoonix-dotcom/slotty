/**
 * Staging/local smoke: SaaS billing lifecycle без live BePaid gateway.
 * npm run staging:billing-saas --prefix server
 */
import { randomUUID } from 'crypto';
import { query } from '../config/db.js';
import { processBePaidWebhook } from '../modules/payments/payments.service.js';
import {
  cancelSubscriptionAtPeriodEnd,
  getBillingSubscription,
  resumeSubscriptionAutoRenew,
} from '../modules/billing/subscriptionBilling.service.js';
import { processBillingJobsBatch } from '../modules/billing/billingJobs.service.js';

async function getMaster(): Promise<{ masterId: string; profileId: string } | null> {
  const r = await query<{ master_id: string }>(
    `select master_id from public.master_profiles limit 1`,
  );
  const id = r.rows[0]?.master_id;
  return id ? { masterId: id, profileId: id } : null;
}

async function main() {
  const m = await getMaster();
  if (!m) {
    console.error('No master');
    process.exit(1);
  }

  const paymentId = randomUUID();
  const token = `test-token-${paymentId.slice(0, 8)}`;

  await query(
    `insert into public.payments (
       id, profile_id, provider, payment_type, status, amount_minor, currency,
       master_id, billing_period, tracking_id
     ) values ($1, $2, 'bepaid', 'master_pro_plan', 'pending', 2900, 'BYN', $3, 'month', $4)`,
    [paymentId, m.profileId, m.masterId, paymentId],
  );

  const okWebhook = {
    transaction: {
      uid: `uid-${paymentId}`,
      status: 'successful',
      tracking_id: paymentId,
      credit_card: { brand: 'visa', last_4: '1097', token },
    },
  };

  await processBePaidWebhook(okWebhook);
  await processBePaidWebhook(okWebhook);

  const afterPay = await getBillingSubscription(m.masterId);
  console.log('1) after payment uiState', afterPay.uiState, 'token?', Boolean(afterPay.cardLast4));

  await cancelSubscriptionAtPeriodEnd(m.masterId, 'smoke');
  const afterCancel = await getBillingSubscription(m.masterId);
  console.log('3) after cancel', afterCancel.uiState, 'next', afterCancel.nextChargeAt);

  await resumeSubscriptionAutoRenew(m.masterId);
  const afterResume = await getBillingSubscription(m.masterId);
  console.log('4) after resume next', afterResume.nextChargeAt);

  const workerReport = await processBillingJobsBatch(5);
  console.log('5) worker tick', workerReport);

  await query(`delete from public.billing_payments where payment_id = $1`, [paymentId]);
  await query(`delete from public.payment_status_events where payment_id = $1`, [paymentId]);
  await query(`delete from public.payments where id = $1`, [paymentId]);

  const ok = afterPay.uiState === 'pro_active' || afterPay.uiState === 'pro_canceled_at_period_end';
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
