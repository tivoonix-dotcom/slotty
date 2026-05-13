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
