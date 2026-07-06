-- Серверный прогресс онбординга мастера (шаг, тариф, checkout)

create table if not exists public.master_onboarding_progress (
  master_id uuid primary key references public.profiles (id) on delete cascade,
  current_step smallint not null default 1 check (current_step between 1 and 8),
  furthest_step smallint not null default 1 check (furthest_step between 1 and 8),
  completed_steps integer[] not null default '{}',
  onboarding_status text not null default 'draft',
  selected_tariff text,
  checkout_status text,
  checkout_payment_id uuid references public.payments (id) on delete set null,
  draft_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_master_onboarding_progress_status
  on public.master_onboarding_progress (onboarding_status);

create index if not exists idx_master_onboarding_progress_updated
  on public.master_onboarding_progress (updated_at desc);

comment on table public.master_onboarding_progress is
  'Серверный прогресс онбординга мастера: шаг, тариф, checkout, черновик.';
comment on column public.master_onboarding_progress.onboarding_status is
  'draft | profile_started | services_added | schedule_added | tariff_selected | checkout_pending | payment_processing | payment_failed | subscription_active | ready_to_publish | completed';
comment on column public.master_onboarding_progress.selected_tariff is 'basic | pro_purchase';
comment on column public.master_onboarding_progress.checkout_status is 'pending | processing | paid | failed | cancelled';
