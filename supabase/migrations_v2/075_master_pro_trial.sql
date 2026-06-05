-- Pro trial 7 дней для новых мастеров (источник истины — master_subscriptions).

alter table public.master_subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_consumed boolean not null default true,
  add column if not exists trial_source text,
  add column if not exists trial_activated_by text;

comment on column public.master_subscriptions.trial_consumed is
  'true = trial уже использован или мастер до миграции; false = может получить trial при onboarding';
comment on column public.master_subscriptions.trial_source is 'onboarding | admin | migration';
comment on column public.master_subscriptions.trial_activated_by is 'system | platform_admin | onboarding';

-- Существующие мастера не получают trial автоматически.
update public.master_subscriptions
   set trial_consumed = true
 where trial_started_at is null;

create index if not exists idx_master_subscriptions_trial_active
  on public.master_subscriptions (trial_ends_at)
  where status = 'trialing'::public.subscription_status;
