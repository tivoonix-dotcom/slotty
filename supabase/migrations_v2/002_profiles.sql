-- SLOTTY DB v2 — profiles + optional telegram_identities

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  telegram_user_id bigint,
  telegram_username text,
  full_name text not null,
  avatar_url text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_telegram_user_id_key unique (telegram_user_id)
);

comment on table public.profiles is 'One row per auth user; id = auth.users.id';
comment on column public.profiles.telegram_user_id is 'Telegram numeric user id; optional unique handle';

create table public.telegram_identities (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  telegram_user_id bigint not null,
  telegram_username text,
  last_init_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_identities_telegram_user_id_key unique (telegram_user_id)
);

comment on table public.telegram_identities is 'Optional 1:1 audit layer for Telegram linkage; profiles still cache telegram_user_id for convenience';

create index idx_profiles_role on public.profiles (role);
