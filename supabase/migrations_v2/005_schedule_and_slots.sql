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
