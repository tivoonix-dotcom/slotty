-- Учёт активных сеансов входа (JWT sid + отзыв с устройств).

create table if not exists public.profile_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  user_agent text,
  client_ip text,
  device_label text not null default 'Устройство',
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists idx_profile_auth_sessions_profile_active
  on public.profile_auth_sessions (profile_id, last_active_at desc)
  where revoked_at is null;

comment on table public.profile_auth_sessions is
  'Сеансы входа (JWT claim sid). Отзыв завершает доступ с этого устройства.';
