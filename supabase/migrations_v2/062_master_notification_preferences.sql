-- Master notification channel + event preferences (settings workspace)

create table if not exists public.master_notification_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  channels jsonb not null default '{"telegram":true,"email":true,"in_app":true}'::jsonb,
  events jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_master_notification_preferences_updated
  on public.master_notification_preferences (updated_at desc);

comment on table public.master_notification_preferences is
  'Per-master notification preferences for settings UI and future delivery filters';
