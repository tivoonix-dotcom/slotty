-- SLOTTY DB v2 — payment methods, subscriptions, vouchers

create table public.payment_methods (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint payment_methods_code_key unique (code)
);

create table public.master_payment_methods (
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (master_id, payment_method_id)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  price_month numeric(12, 2) not null,
  price_year numeric(12, 2) not null,
  max_services integer,
  max_monthly_appointments integer,
  max_schedule_days_ahead integer not null,
  can_use_analytics boolean not null default false,
  can_use_pdf boolean not null default false,
  can_use_priority_listing boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_code_key unique (code),
  constraint subscription_plans_max_services_nonneg check (
    max_services is null
    or max_services >= 0
  ),
  constraint subscription_plans_max_monthly_nonneg check (
    max_monthly_appointments is null
    or max_monthly_appointments >= 0
  ),
  constraint subscription_plans_max_schedule_days_pos check (max_schedule_days_ahead > 0)
);

create table public.master_subscriptions (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null unique references public.master_profiles (master_id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  billing_period public.billing_period not null default 'month',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  constraint master_subscriptions_period_order check (current_period_end > current_period_start),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_subscriptions_plan on public.master_subscriptions (plan_id);

create table public.booking_vouchers (
  id uuid primary key default gen_random_uuid (),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  voucher_number text not null,
  constraint booking_vouchers_voucher_number_key unique (voucher_number),
  pdf_url text,
  created_at timestamptz not null default now()
);
