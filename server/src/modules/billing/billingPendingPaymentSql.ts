/** INSERT pending billing_payments — явные cast, чтобы один $N не смешивал uuid и text. */
export const INSERT_PENDING_BILLING_PAYMENT_SQL = `
  insert into public.billing_payments (
    subscription_id, master_id, profile_id, payment_id, provider_payment_id,
    amount, currency, status, payment_kind, idempotency_key
  ) values (
    $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text,
    $6::numeric, $7::text, 'pending'::public.billing_payment_status,
    $8::public.billing_payment_kind, $9::text
  )
  on conflict (idempotency_key) do nothing
`;
