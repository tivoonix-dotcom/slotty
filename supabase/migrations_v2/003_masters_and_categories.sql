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
