-- Billing checkout purpose, package months, idempotency hardening

alter type public.billing_payment_kind add value if not exists 'manual_topup';
alter type public.billing_payment_kind add value if not exists 'update_card';
alter type public.billing_payment_kind add value if not exists 'retry_payment';

alter table public.payments
  add column if not exists checkout_purpose text,
  add column if not exists billing_package_months smallint,
  add column if not exists checkout_idempotency_key text;

comment on column public.payments.checkout_purpose is
  'initial_purchase | manual_topup | update_card | retry_payment | renewal_charge';
comment on column public.payments.billing_package_months is '1, 3 or 12 — длительность пакета Pro';
comment on column public.payments.checkout_idempotency_key is 'Стабильный ключ для dedup pending checkout';

create unique index if not exists idx_payments_checkout_idempotency_key
  on public.payments (checkout_idempotency_key)
  where checkout_idempotency_key is not null;

create index if not exists idx_payments_master_pending_checkout
  on public.payments (master_id, checkout_purpose, billing_package_months, created_at desc)
  where status = 'pending'::public.payment_status and master_id is not null;
