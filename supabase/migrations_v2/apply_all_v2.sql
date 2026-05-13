/*
  SLOTTY DB v2 — ОДИН ФАЙЛ для ручного применения в Supabase SQL Editor.

  ВНИМАНИЕ
  - Применять ТОЛЬКО на чистой ТЕСТОВОЙ базе Supabase (новый проект или пустая public).
  - НЕ применять на production.
  - Старая схема v1 (supabase/schema.sql и объекты с теми же именами) КОНФЛИКТУЕТ:
    profiles, user_role, триггер on_auth_user_created и т.д.
  - Если в тестовой БД остались старые объекты — сначала удалите их или создайте новый проект.

  Содержимое = миграции 001 … 013 по порядку (копия для удобства; источник правды — отдельные файлы 00X_*.sql).

  После успешного выполнения: smoke_test_v2.sql, затем ручные шаги из manual_test_plan.md
*/


-- ======================================================================
-- FILE: 001_extensions_and_enums.sql
-- ======================================================================

-- SLOTTY DB v2 — extensions and enum types
-- Apply to an EMPTY project or after removing legacy v1 objects from public schema.

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------- enums

create type public.user_role as enum ('client', 'master', 'platform_admin');

create type public.master_publication_status as enum ('draft', 'published', 'hidden', 'blocked');

create type public.visit_type as enum ('studio', 'at_home');

create type public.price_type as enum ('fixed', 'from');

create type public.slot_status as enum ('available', 'booked', 'blocked', 'expired');

create type public.slot_source as enum ('manual', 'generated');

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_master',
  'no_show'
);

create type public.review_status as enum ('published', 'hidden');

create type public.career_item_type as enum ('education', 'course', 'practice', 'work');

create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'incomplete'
);

create type public.billing_period as enum ('month', 'year');

create type public.notification_type as enum (
  'appointment_new',
  'appointment_confirmed',
  'appointment_reminder',
  'appointment_cancelled',
  'review_request',
  'billing',
  'system'
);


-- ======================================================================
-- FILE: 002_profiles.sql
-- ======================================================================

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


-- ======================================================================
-- FILE: 003_masters_and_categories.sql
-- ======================================================================

-- SLOTTY DB v2 — service categories + master_profiles (PK = master_id)

create table public.service_categories (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_code_key unique (code)
);

comment on column public.service_categories.code is 'Stable machine code, e.g. manicure, barbers';

create table public.master_profiles (
  master_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  slug text,
  primary_category_id uuid references public.service_categories (id) on delete set null,
  bio text not null default '',
  phone text,
  contact text,
  photo_url text,
  publication_status public.master_publication_status not null default 'draft',
  rating_avg numeric(3, 2) not null default 0,
  constraint master_profiles_rating_avg_range check (
    rating_avg >= 0::numeric
    and rating_avg <= 5::numeric
  ),
  reviews_count integer not null default 0,
  constraint master_profiles_reviews_count_nonneg check (reviews_count >= 0),
  global_buffer_minutes smallint not null default 15,
  constraint master_profiles_global_buffer_range check (
    global_buffer_minutes >= 0
    and global_buffer_minutes <= 240
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_profiles_slug_key unique (slug)
);

create index idx_master_profiles_publication on public.master_profiles (publication_status);

create index idx_master_profiles_primary_category on public.master_profiles (primary_category_id);


-- ======================================================================
-- FILE: 004_services_locations_rules.sql
-- ======================================================================

-- SLOTTY DB v2 — services, locations, weekly rules, booking rules text

create table public.master_services (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  category_id uuid not null references public.service_categories (id) on delete restrict,
  title text not null,
  description text not null default '',
  duration_minutes smallint not null,
  constraint master_services_duration_positive check (duration_minutes > 0),
  price_amount numeric(12, 2) not null,
  constraint master_services_price_nonneg check (price_amount >= 0::numeric),
  price_type public.price_type not null default 'fixed',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_services_master on public.master_services (master_id);

create index idx_master_services_master_active on public.master_services (master_id, is_active, sort_order);

create index idx_master_services_category on public.master_services (category_id);

create table public.master_locations (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  visit_type public.visit_type not null,
  city text not null,
  street text not null,
  building text not null,
  building_detail text,
  entrance text,
  floor text,
  room text,
  intercom text,
  landmark text,
  directions text,
  client_note text,
  lat double precision,
  lng double precision,
  public_address text not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index master_locations_one_primary_per_master on public.master_locations (master_id)
where
  is_primary = true;

create index idx_master_locations_master on public.master_locations (master_id);

create table public.master_schedule_rules (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  weekday smallint not null,
  constraint master_schedule_rules_weekday_range check (
    weekday >= 0
    and weekday <= 6
  ),
  start_time time not null,
  end_time time not null,
  constraint master_schedule_rules_time_order check (end_time > start_time),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_schedule_rules_master_weekday_window unique (master_id, weekday, start_time, end_time)
);

comment on column public.master_schedule_rules.weekday is '0 = Sunday … 6 = Saturday (same as JS Date.getDay())';

create index idx_master_schedule_rules_master_day on public.master_schedule_rules (master_id, weekday)
where
  is_active = true;

create table public.master_booking_rules (
  master_id uuid primary key references public.master_profiles (master_id) on delete cascade,
  booking_rules text,
  cancellation_policy text,
  payment_note text,
  updated_at timestamptz not null default now()
);


-- ======================================================================
-- FILE: 005_schedule_and_slots.sql
-- ======================================================================

-- SLOTTY DB v2 — concrete availability slots

create table public.master_availability_slots (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  service_id uuid references public.master_services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint master_availability_slots_time_order check (ends_at > starts_at),
  status public.slot_status not null default 'available',
  source public.slot_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_availability_slots_master_starts on public.master_availability_slots (master_id, starts_at);

create index idx_master_availability_slots_master_status_starts on public.master_availability_slots (master_id, status, starts_at);

create index idx_master_availability_slots_available_only on public.master_availability_slots (master_id, starts_at)
where
  status = 'available';


-- ======================================================================
-- FILE: 006_appointments.sql
-- ======================================================================

-- SLOTTY DB v2 — appointments (snapshots + unique slot)

create table public.appointments (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references public.profiles (id) on delete restrict,
  master_id uuid not null references public.master_profiles (master_id) on delete restrict,
  service_id uuid not null references public.master_services (id) on delete restrict,
  slot_id uuid not null unique references public.master_availability_slots (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint appointments_time_order check (ends_at > starts_at),
  status public.appointment_status not null default 'pending',
  price_snapshot numeric(12, 2) not null,
  price_type_snapshot public.price_type not null,
  service_title_snapshot text not null,
  service_duration_snapshot smallint not null,
  constraint appointments_service_duration_positive check (service_duration_snapshot > 0),
  client_note text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_no_self_booking check (client_id <> master_id)
);

create index idx_appointments_client_starts on public.appointments (client_id, starts_at desc);

create index idx_appointments_master_starts on public.appointments (master_id, starts_at desc);

create index idx_appointments_master_status_starts on public.appointments (master_id, status, starts_at);


-- ======================================================================
-- FILE: 007_favorites_reviews_notifications.sql
-- ======================================================================

-- SLOTTY DB v2 — favorites, reviews, notifications

create table public.favorite_masters (
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, master_id)
);

create index idx_favorite_masters_master on public.favorite_masters (master_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid (),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  rating smallint not null,
  constraint reviews_rating_range check (
    rating >= 1
    and rating <= 5
  ),
  body text not null,
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reviews_master_status_created on public.reviews (master_id, status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

create index idx_notifications_user_unread on public.notifications (user_id)
where
  read_at is null;


-- ======================================================================
-- FILE: 008_trust_profile.sql
-- ======================================================================

-- SLOTTY DB v2 — portfolio, certificates, career

create table public.master_portfolio_items (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  image_url text not null,
  title text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_portfolio_master on public.master_portfolio_items (master_id, sort_order);

create table public.master_certificates (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  title text not null,
  issuer text not null,
  year smallint,
  image_url text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_certificates_master on public.master_certificates (master_id, sort_order);

create table public.master_career_items (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  type public.career_item_type not null,
  title text not null,
  place text not null,
  start_year smallint,
  end_year smallint,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_career_master on public.master_career_items (master_id, sort_order);


-- ======================================================================
-- FILE: 009_billing_and_vouchers.sql
-- ======================================================================

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


-- ======================================================================
-- FILE: 010_triggers_and_indexes.sql
-- ======================================================================

-- SLOTTY DB v2 — updated_at triggers, auth bootstrap, review aggregates

-- --------------------------------------------------------------------------- updated_at

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles for each row
execute function public.set_updated_at ();

create trigger trg_telegram_identities_updated
before update on public.telegram_identities for each row
execute function public.set_updated_at ();

create trigger trg_service_categories_updated
before update on public.service_categories for each row
execute function public.set_updated_at ();

create trigger trg_master_profiles_updated
before update on public.master_profiles for each row
execute function public.set_updated_at ();

create trigger trg_master_services_updated
before update on public.master_services for each row
execute function public.set_updated_at ();

create trigger trg_master_locations_updated
before update on public.master_locations for each row
execute function public.set_updated_at ();

create trigger trg_master_schedule_rules_updated
before update on public.master_schedule_rules for each row
execute function public.set_updated_at ();

create trigger trg_master_availability_slots_updated
before update on public.master_availability_slots for each row
execute function public.set_updated_at ();

create trigger trg_appointments_updated
before update on public.appointments for each row
execute function public.set_updated_at ();

create trigger trg_reviews_updated
before update on public.reviews for each row
execute function public.set_updated_at ();

create trigger trg_notifications_updated
before update on public.notifications for each row
execute function public.set_updated_at ();

create trigger trg_master_portfolio_items_updated
before update on public.master_portfolio_items for each row
execute function public.set_updated_at ();

create trigger trg_master_certificates_updated
before update on public.master_certificates for each row
execute function public.set_updated_at ();

create trigger trg_master_career_items_updated
before update on public.master_career_items for each row
execute function public.set_updated_at ();

create trigger trg_subscription_plans_updated
before update on public.subscription_plans for each row
execute function public.set_updated_at ();

create trigger trg_master_subscriptions_updated
before update on public.master_subscriptions for each row
execute function public.set_updated_at ();

-- master_booking_rules: only updated_at column, still bump on any update
create trigger trg_master_booking_rules_updated
before update on public.master_booking_rules for each row
execute function public.set_updated_at ();

-- --------------------------------------------------------------------------- auth.users → profiles

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_tg bigint;
  v_full text;
  v_avatar text;
  v_username text;
  v_role public.user_role;
begin
  v_tg := coalesce(
    nullif(new.raw_user_meta_data ->> 'tg_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'sub', '')::bigint
  );

  v_full := coalesce(
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

  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when invalid_text_representation then
      v_role := 'client';
  end;

  insert into public.profiles(id, telegram_user_id, telegram_username, full_name, avatar_url, role)
    values (
      new.id,
      v_tg,
      v_username,
      coalesce(v_full, 'Пользователь'),
      nullif(v_avatar, ''),
      coalesce(v_role, 'client')
    )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

-- --------------------------------------------------------------------------- review aggregates → master_profiles

create or replace function public.refresh_master_review_stats (p_master_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_avg numeric(3, 2);
  v_cnt integer;
begin
  select
    coalesce(avg(r.rating::numeric), 0::numeric),
    count(*)::integer into v_avg,
    v_cnt
  from
    public.reviews r
  where
    r.master_id = p_master_id
    and r.status = 'published';

  update public.master_profiles mp
  set
    rating_avg = round(v_avg, 2),
    reviews_count = v_cnt
  where
    mp.master_id = p_master_id;
end;
$$;

create or replace function public.trg_reviews_refresh_master_stats ()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_mid uuid;
begin
  if tg_op = 'DELETE' then
    v_mid := old.master_id;
  else
    v_mid := new.master_id;
  end if;

  perform public.refresh_master_review_stats (v_mid);

  if tg_op = 'UPDATE' and old.master_id is distinct from new.master_id then
    perform public.refresh_master_review_stats (old.master_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_master_stats
after insert
or
update of rating,
status,
master_id
or delete on public.reviews for each row
execute function public.trg_reviews_refresh_master_stats ();

-- --------------------------------------------------------------------------- extra indexes (audit / listing)

create index if not exists idx_appointments_status_starts on public.appointments (status, starts_at desc);

-- replace partial unread index with ordering for “новые сверху”
drop index if exists public.idx_notifications_user_unread;

create index idx_notifications_user_unread on public.notifications (user_id, created_at desc)
where
  read_at is null;


-- ======================================================================
-- FILE: 011_rls_policies.sql
-- ======================================================================

-- SLOTTY DB v2 — Row Level Security policies
-- Assumes Supabase roles: anon, authenticated, service_role (service_role bypasses RLS).

-- --------------------------------------------------------------------------- enable RLS

alter table public.profiles enable row level security;

alter table public.telegram_identities enable row level security;

alter table public.service_categories enable row level security;

alter table public.master_profiles enable row level security;

alter table public.master_services enable row level security;

alter table public.master_locations enable row level security;

alter table public.master_schedule_rules enable row level security;

alter table public.master_availability_slots enable row level security;

alter table public.appointments enable row level security;

alter table public.favorite_masters enable row level security;

alter table public.reviews enable row level security;

alter table public.notifications enable row level security;

alter table public.master_portfolio_items enable row level security;

alter table public.master_certificates enable row level security;

alter table public.master_career_items enable row level security;

alter table public.master_booking_rules enable row level security;

alter table public.payment_methods enable row level security;

alter table public.master_payment_methods enable row level security;

alter table public.subscription_plans enable row level security;

alter table public.master_subscriptions enable row level security;

alter table public.booking_vouchers enable row level security;

-- --------------------------------------------------------------------------- profiles

create policy profiles_select_own on public.profiles for
select
  to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles for
update
  to authenticated using (id = (select auth.uid()))
with
  check (id = (select auth.uid()));

-- --------------------------------------------------------------------------- telegram_identities

create policy telegram_identities_select_own on public.telegram_identities for
select
  to authenticated using (profile_id = (select auth.uid()));

create policy telegram_identities_insert_own on public.telegram_identities for insert to authenticated
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_update_own on public.telegram_identities for
update
  to authenticated using (profile_id = (select auth.uid()))
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_delete_own on public.telegram_identities for delete to authenticated using (profile_id = (select auth.uid()));

-- --------------------------------------------------------------------------- service_categories (read-only catalog)

create policy service_categories_select_all on public.service_categories for
select
  using (true);

-- --------------------------------------------------------------------------- master_profiles

create policy master_profiles_select_public_or_own on public.master_profiles for
select
  using (
    publication_status = 'published'
    or master_id = (select auth.uid())
  );

create policy master_profiles_insert_self on public.master_profiles for insert to authenticated
with
  check (master_id = (select auth.uid()));

create policy master_profiles_update_own on public.master_profiles for
update
  to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_profiles_delete_own on public.master_profiles for delete to authenticated using (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_services

create policy master_services_select_catalog_or_own on public.master_services for
select
  using (
    master_id = (select auth.uid())
    or (
      is_active = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_services.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_services_write_own on public.master_services for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_locations

create policy master_locations_select_public_or_own on public.master_locations for
select
  using (
    master_id = (select auth.uid())
    or (
      is_primary = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_locations.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_locations_write_own on public.master_locations for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_schedule_rules

create policy master_schedule_rules_select_public_or_own on public.master_schedule_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_schedule_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_schedule_rules_write_own on public.master_schedule_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_availability_slots

create policy master_slots_select_public_or_own on public.master_availability_slots for
select
  using (
    master_id = (select auth.uid())
    or (
      status = 'available'
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_availability_slots.master_id
          and mp.publication_status = 'published'
      )
    )
  );

-- INSERT: только свои слоты. UPDATE/DELETE: только status = available (booked меняет только SECURITY DEFINER RPC).
create policy master_slots_insert_own on public.master_availability_slots for insert to authenticated
with
  check (master_id = (select auth.uid()));

create policy master_slots_update_own_available on public.master_availability_slots for
update
  to authenticated using (
    master_id = (select auth.uid())
    and status = 'available'::public.slot_status
  )
with
  check (
    master_id = (select auth.uid())
    and status = 'available'::public.slot_status
  );

create policy master_slots_delete_own_available on public.master_availability_slots for delete to authenticated using (
  master_id = (select auth.uid())
  and status = 'available'::public.slot_status
  and not exists (
    select
      1
    from
      public.appointments a
    where
      a.slot_id = master_availability_slots.id
  )
);

-- --------------------------------------------------------------------------- appointments (no direct insert from clients)

create policy appointments_select_party on public.appointments for
select
  to authenticated using (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy appointments_insert_blocked on public.appointments for insert to authenticated
with
  check (false);

-- Прямой UPDATE запрещён: смена статусов / отмена — только через RPC (cancel_*, confirm_*, complete_*).

-- --------------------------------------------------------------------------- favorite_masters

create policy favorite_masters_all_own on public.favorite_masters for all to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- reviews

create policy reviews_select_public_or_party on public.reviews for
select
  using (
    status = 'published'
    or client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy reviews_insert_completed on public.reviews for insert to authenticated
with
  check (
    client_id = (select auth.uid())
    and master_id = (
      select
        a.master_id
      from
        public.appointments a
      where
        a.id = appointment_id
    )
    and exists (
      select
        1
      from
        public.appointments a
      where
        a.id = appointment_id
        and a.client_id = (select auth.uid())
        and a.status = 'completed'
    )
  );

create policy reviews_update_own_client on public.reviews for
update
  to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

create policy reviews_delete_own_client on public.reviews for delete to authenticated using (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- notifications

create policy notifications_select_own on public.notifications for
select
  to authenticated using (user_id = (select auth.uid()));

create policy notifications_update_read_own on public.notifications for
update
  to authenticated using (user_id = (select auth.uid()))
with
  check (user_id = (select auth.uid()));

-- --------------------------------------------------------------------------- trust: portfolio / certificates / career

create policy master_portfolio_select_public_or_own on public.master_portfolio_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_portfolio_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_portfolio_write_own on public.master_portfolio_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_certificates_select_public_or_own on public.master_certificates for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_certificates.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_certificates_write_own on public.master_certificates for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_career_select_public_or_own on public.master_career_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_career_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_career_write_own on public.master_career_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_booking_rules

create policy master_booking_rules_select_public_or_own on public.master_booking_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_booking_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_booking_rules_write_own on public.master_booking_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- payment_methods (read-only reference)

create policy payment_methods_select_all on public.payment_methods for
select
  using (true);

-- --------------------------------------------------------------------------- master_payment_methods

create policy master_payment_methods_select_public_or_own on public.master_payment_methods for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_payment_methods.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_payment_methods_write_own on public.master_payment_methods for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- subscription_plans

create policy subscription_plans_select_all on public.subscription_plans for
select
  using (true);

-- --------------------------------------------------------------------------- master_subscriptions

create policy master_subscriptions_select_own on public.master_subscriptions for
select
  to authenticated using (master_id = (select auth.uid()));

create policy master_subscriptions_write_own on public.master_subscriptions for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- booking_vouchers

create policy booking_vouchers_select_party on public.booking_vouchers for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.appointments a
      where
        a.id = booking_vouchers.appointment_id
        and (
          a.client_id = (select auth.uid())
          or a.master_id = (select auth.uid())
        )
    )
  );

create policy booking_vouchers_insert_blocked on public.booking_vouchers for insert to authenticated
with
  check (false);


-- ======================================================================
-- FILE: 012_seed.sql
-- ======================================================================

-- SLOTTY DB v2 — reference seed (categories, payment methods, subscription plans)
-- Deterministic UUIDs for stable references in fixtures / tests.

insert into public.service_categories (id, code, name, sort_order)
values
  ('11111111-1111-4111-8111-111111110001', 'manicure', 'Маникюр', 10),
  ('11111111-1111-4111-8111-111111110002', 'barbers', 'Барберы', 20),
  ('11111111-1111-4111-8111-111111110003', 'brows-lashes', 'Брови и ресницы', 30),
  ('11111111-1111-4111-8111-111111110004', 'massage', 'Массаж', 40),
  ('11111111-1111-4111-8111-111111110005', 'fitness', 'Фитнес', 50),
  ('11111111-1111-4111-8111-111111110006', 'tattoo', 'Тату', 60)
on conflict (code) do nothing;

insert into public.payment_methods (id, code, name, sort_order)
values
  ('33333333-3333-4333-8333-333333330001', 'cash', 'Наличные', 10),
  ('33333333-3333-4333-8333-333333330002', 'card', 'Карта', 20),
  ('33333333-3333-4333-8333-333333330003', 'transfer', 'Перевод', 30),
  ('33333333-3333-4333-8333-333333330004', 'online_later', 'Онлайн позже', 40)
on conflict (code) do nothing;

insert into public.subscription_plans (
  id,
  code,
  name,
  price_month,
  price_year,
  max_services,
  max_monthly_appointments,
  max_schedule_days_ahead,
  can_use_analytics,
  can_use_pdf,
  can_use_priority_listing,
  sort_order
)
values
  (
    '22222222-2222-4222-8222-222222220001',
    'free',
    'Free',
    0,
    0,
    3,
    20,
    14,
    false,
    false,
    false,
    10
  ),
  (
    '22222222-2222-4222-8222-222222220002',
    'pro',
    'Pro',
    29,
    290,
    null,
    null,
    90,
    true,
    true,
    true,
    20
  )
on conflict (code) do nothing;


-- ======================================================================
-- FILE: 013_rpc_create_appointment_atomic.sql
-- ======================================================================

-- SLOTTY DB v2 — atomic booking RPC (SECURITY DEFINER)
-- Run after RLS: bypasses RLS for inserts/updates performed inside the function body.

create or replace function public.create_appointment_atomic (
  p_slot_id uuid,
  p_service_id uuid,
  p_client_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid;
  v_slot public.master_availability_slots%rowtype;
  v_service public.master_services%rowtype;
  v_master uuid;
  v_starts timestamptz;
  v_ends timestamptz;
  v_appt_id uuid;
  v_voucher_num text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select
    * into strict v_slot
  from
    public.master_availability_slots
  where
    id = p_slot_id
  for update;

  if v_slot.status is distinct from 'available'::public.slot_status then
    raise exception 'slot_unavailable';
  end if;

  if v_slot.starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  select
    * into strict v_service
  from
    public.master_services
  where
    id = p_service_id;

  if v_service.is_active is not true then
    raise exception 'service_inactive';
  end if;

  if v_service.master_id <> v_slot.master_id then
    raise exception 'service_master_mismatch';
  end if;

  if v_slot.service_id is not null and v_slot.service_id <> p_service_id then
    raise exception 'service_slot_mismatch';
  end if;

  if v_slot.starts_at + (v_service.duration_minutes * interval '1 minute') > v_slot.ends_at then
    raise exception 'service_does_not_fit_slot';
  end if;

  v_master := v_slot.master_id;
  v_starts := v_slot.starts_at;
  v_ends := v_slot.starts_at + (v_service.duration_minutes * interval '1 minute');

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.master_id = v_master
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
      and tstzrange (a.starts_at, a.ends_at, '[)') && tstzrange (v_starts, v_ends, '[)')
  ) then
    raise exception 'master_has_overlapping_appointment';
  end if;

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.client_id = v_uid
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
      and tstzrange (a.starts_at, a.ends_at, '[)') && tstzrange (v_starts, v_ends, '[)')
  ) then
    raise exception 'client_has_overlapping_appointment';
  end if;

  insert into public.appointments (
    client_id,
    master_id,
    service_id,
    slot_id,
    starts_at,
    ends_at,
    status,
    price_snapshot,
    price_type_snapshot,
    service_title_snapshot,
    service_duration_snapshot,
    client_note
  )
  values (
    v_uid,
    v_master,
    p_service_id,
    p_slot_id,
    v_starts,
    v_ends,
    'pending'::public.appointment_status,
    v_service.price_amount,
    v_service.price_type,
    v_service.title,
    v_service.duration_minutes,
    p_client_note
  )
returning
  id into v_appt_id;

  update public.master_availability_slots s
  set
    status = 'booked'::public.slot_status,
    updated_at = now()
  where
    s.id = p_slot_id;

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_master,
    'appointment_new'::public.notification_type,
    'Новая запись',
    'У вас новая запись от клиента',
    'appointment',
    v_appt_id
  );

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_uid,
    'appointment_confirmed'::public.notification_type,
    'Запись создана',
    'Вы записались к мастеру',
    'appointment',
    v_appt_id
  );

  v_voucher_num := 'SLO-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.booking_vouchers (appointment_id, voucher_number)
  values (v_appt_id, v_voucher_num);

  return jsonb_build_object(
    'appointment_id',
    v_appt_id,
    'master_id',
    v_master,
    'service_title',
    v_service.title,
    'starts_at',
    v_starts,
    'ends_at',
    v_ends,
    'price',
    v_service.price_amount,
    'voucher_number',
    v_voucher_num
  );
exception
  when no_data_found then
    raise exception 'slot_or_service_not_found';
end;
$$;

comment on function public.create_appointment_atomic (uuid, uuid, text) is 'Atomically books a slot, creates appointment + voucher + notifications in one transaction.';

revoke all on function public.create_appointment_atomic (uuid, uuid, text) from public;

revoke all on function public.create_appointment_atomic (uuid, uuid, text) from anon;

grant execute on function public.create_appointment_atomic (uuid, uuid, text) to authenticated;

