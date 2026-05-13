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
