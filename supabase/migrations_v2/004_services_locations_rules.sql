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
