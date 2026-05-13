-- =============================================================================
-- SLOTTY — 3NF schema, RLS, Telegram profile bootstrap
-- Run in Supabase Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================================
-- Drops existing public booking tables (dev reset). Backup production data first.
-- =============================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------- §DROPS
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.appointments cascade;

drop table if exists public.services cascade;

drop table if exists public.work_schedules cascade;

drop table if exists public.masters_metadata cascade;

drop table if exists public.profiles cascade;

drop type if exists public.appointment_status cascade;

drop type if exists public.user_role cascade;

drop function if exists public.set_updated_at () cascade;

drop function if exists public.enforce_masters_metadata_role () cascade;

drop function if exists public.handle_new_user () cascade;

-- --------------------------------------------------------------------------- §ENUMS
create type public.user_role as enum ('master', 'client');

create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled');

-- --------------------------------------------------------------------------- §TABLES
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tg_id bigint unique,
  full_name text not null,
  avatar_url text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.tg_id is 'Telegram numeric user id; unique when present';

comment on column public.profiles.role is 'master: services/schedules/metadata; client: books masters';

create table public.masters_metadata (
  master_id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  rating numeric(3, 2) not null default 0
    check (rating >= 0 and rating <= 5),
  global_buffer_minutes smallint not null default 15
    check (global_buffer_minutes >= 0 and global_buffer_minutes <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_schedules (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (
    day_of_week >= 0
    and day_of_week <= 6
  ),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_schedules_time_ok check (end_time > start_time),
  unique (master_id, day_of_week, start_time, end_time)
);

comment on column public.work_schedules.day_of_week is '0 = Sunday … 6 = Saturday (same as JS Date.getDay())';

create table public.services (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_minutes smallint not null check (duration_minutes > 0),
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.profiles (id) on delete set null,
  service_id uuid not null references public.services (id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  client_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_ok check (end_at > start_at),
  constraint appointments_no_self_booking check (master_id <> client_id)
);

-- --------------------------------------------------------------------------- §INDEXES
create index idx_profiles_role on public.profiles (role);

create index idx_work_schedules_master_day on public.work_schedules (master_id, day_of_week)
where
  is_active = true;

create index idx_services_master on public.services (master_id);

create index idx_appointments_master_range on public.appointments (master_id, start_at, end_at);

create index idx_appointments_client on public.appointments (client_id, start_at);

-- --------------------------------------------------------------------------- §TIMESTAMPS
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles for each row
execute procedure public.set_updated_at ();

create trigger trg_masters_metadata_updated
before update on public.masters_metadata for each row
execute procedure public.set_updated_at ();

create trigger trg_work_schedules_updated
before update on public.work_schedules for each row
execute procedure public.set_updated_at ();

create trigger trg_services_updated
before update on public.services for each row
execute procedure public.set_updated_at ();

create trigger trg_appointments_updated
before update on public.appointments for each row
execute procedure public.set_updated_at ();

-- --------------------------------------------------------------------------- §MASTERS_METADATA ROLE
create or replace function public.enforce_masters_metadata_role ()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where
      p.id = new.master_id
      and p.role = 'master'
  ) then
    raise exception 'masters_metadata.master_id must reference a profile with role=master';
  end if;
  return new;
end;
$$;

create trigger trg_masters_metadata_role
before insert or update on public.masters_metadata for each row
execute procedure public.enforce_masters_metadata_role ();

-- --------------------------------------------------------------------------- §PROFILE FROM TELEGRAM (auth.users)
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tg_id bigint;
  v_full_name text;
  v_avatar text;
  v_role public.user_role;
begin
  v_tg_id := coalesce(
    nullif(new.raw_user_meta_data ->> 'tg_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'sub', '')::bigint
  );

  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
          nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
        )
      ),
      ''
    ),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Пользователь'
  );

  v_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when invalid_text_representation then
      v_role := 'client';
  end;

  insert into public.profiles(id, tg_id, full_name, avatar_url, role)
    values (new.id, v_tg_id, coalesce(v_full_name, 'Пользователь'), v_avatar, coalesce(v_role, 'client'))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

-- --------------------------------------------------------------------------- §RLS
alter table public.profiles enable row level security;

alter table public.masters_metadata enable row level security;

alter table public.work_schedules enable row level security;

alter table public.services enable row level security;

alter table public.appointments enable row level security;

-- Public read: master profiles (anon + authenticated for catalog / TWA)
create policy "profiles_select_public_masters" on public.profiles for
select
  using (role = 'master');

-- Authenticated: read own row (clients + masters)
create policy "profiles_select_self" on public.profiles for
select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles for
update
  to authenticated
  using (auth.uid() = id)
with
  check (auth.uid() = id);

-- masters_metadata: masters manage; authenticated clients can read (not anon)
create policy "masters_metadata_select_clients" on public.masters_metadata for
select
  to authenticated
  using (true);

create policy "masters_metadata_master_write" on public.masters_metadata for all to authenticated using (auth.uid() = master_id)
with
  check (auth.uid() = master_id);

-- work_schedules: authenticated read (clients + masters); master full CRUD
create policy "work_schedules_select_booking" on public.work_schedules for
select
  to authenticated
  using (true);

create policy "work_schedules_master_write" on public.work_schedules for all to authenticated using (auth.uid() = master_id)
with
  check (auth.uid() = master_id);

-- services: catalog read; master full CRUD
create policy "services_select_catalog" on public.services for
select
  using (
    exists (
      select 1
      from public.profiles p
      where
        p.id = master_id
        and p.role = 'master'
    )
  );

create policy "services_master_write" on public.services for all to authenticated using (auth.uid() = master_id)
with
  check (auth.uid() = master_id);

-- appointments: party read; master full CRUD own; client insert/update/delete own
create policy "appointments_select_party" on public.appointments for
select
  to authenticated
  using (auth.uid() = master_id or auth.uid() = client_id);

create policy "appointments_master_write" on public.appointments for all to authenticated using (auth.uid() = master_id)
with
  check (auth.uid() = master_id);

create policy "appointments_client_insert" on public.appointments for insert to authenticated
with
  check (
    client_id = auth.uid()
    and master_id <> auth.uid()
  );

create policy "appointments_client_update" on public.appointments for
update
  to authenticated
  using (auth.uid() = client_id)
with
  check (auth.uid() = client_id);

create policy "appointments_client_delete" on public.appointments for delete to authenticated using (auth.uid() = client_id);
