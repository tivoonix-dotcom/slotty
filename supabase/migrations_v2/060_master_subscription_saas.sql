-- SLOTTY — SaaS-подписка Master Pro: расширенная модель + история billing_payments

alter type public.subscription_status add value if not exists 'canceled_at_period_end';
alter type public.subscription_status add value if not exists 'payment_failed';
alter type public.subscription_status add value if not exists 'expired';

alter type public.payment_type add value if not exists 'recurring_payment';

create type public.billing_payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'canceled'
);

create type public.billing_payment_kind as enum (
  'initial_payment',
  'recurring_payment',
  'refund'
);

alter table public.master_subscriptions
  add column if not exists price_amount numeric(12, 2),
  add column if not exists currency text not null default 'BYN',
  add column if not exists next_charge_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists provider public.payment_provider,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_payment_method_id text,
  add column if not exists card_brand text,
  add column if not exists card_last4 text,
  add column if not exists card_exp_month smallint,
  add column if not exists card_exp_year smallint,
  add column if not exists auto_renew_consent_at timestamptz,
  add column if not exists last_payment_id uuid references public.payments (id) on delete set null;

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.master_subscriptions (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  provider public.payment_provider not null default 'bepaid',
  payment_id uuid references public.payments (id) on delete set null,
  provider_payment_id text,
  amount numeric(12, 2) not null,
  currency text not null default 'BYN',
  status public.billing_payment_status not null default 'pending',
  payment_kind public.billing_payment_kind not null,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  receipt_url text,
  invoice_number text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payments_idempotency_key_key unique (idempotency_key),
  constraint billing_payments_provider_payment_id_key unique (provider_payment_id)
);

create index if not exists idx_billing_payments_subscription on public.billing_payments (subscription_id, created_at desc);
create index if not exists idx_billing_payments_master on public.billing_payments (master_id, created_at desc);

create trigger trg_billing_payments_updated
before update on public.billing_payments
for each row execute function public.set_updated_at();

alter table public.billing_payments enable row level security;

comment on table public.billing_payments is 'История платежей подписки мастера (SaaS billing)';
comment on column public.master_subscriptions.next_charge_at is 'Дата следующего автосписания; null если автопродление отключено';
