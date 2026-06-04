-- SLOTTY — billing jobs (renewal charge, reminders, expire)

create type public.subscription_billing_job_type as enum (
  'renewal_charge',
  'renewal_reminder',
  'expire_subscription'
);

create type public.subscription_billing_job_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'skipped'
);

alter table public.master_subscriptions
  add column if not exists provider_card_token text,
  add column if not exists renewal_reminder_sent_for date,
  add column if not exists auto_renew_enabled boolean not null default true;

create table if not exists public.subscription_billing_jobs (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.master_subscriptions (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  job_type public.subscription_billing_job_type not null,
  scheduled_at timestamptz not null,
  status public.subscription_billing_job_status not null default 'pending',
  attempts smallint not null default 0,
  idempotency_key text not null,
  payment_id uuid references public.payments (id) on delete set null,
  provider_payment_id text,
  last_error text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_billing_jobs_idempotency_key_key unique (idempotency_key)
);

create index if not exists idx_subscription_billing_jobs_due
  on public.subscription_billing_jobs (status, scheduled_at)
  where status in ('pending', 'processing');

create index if not exists idx_subscription_billing_jobs_subscription
  on public.subscription_billing_jobs (subscription_id, created_at desc);

create trigger trg_subscription_billing_jobs_updated
before update on public.subscription_billing_jobs
for each row execute function public.set_updated_at();

alter table public.subscription_billing_jobs enable row level security;

comment on column public.master_subscriptions.provider_card_token is 'Токен карты bePaid для MIT recurring (не PAN/CVV)';
comment on table public.subscription_billing_jobs is 'Очередь billing worker: списания, напоминания, истечение';
