create table if not exists public.booking_client_reports (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  client_user_id uuid references public.profiles (id) on delete set null,
  reason_code text not null
    check (reason_code in ('client_misconduct', 'client_not_paid', 'client_harassment', 'client_fake_info', 'other')),
  reason_text text,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'closed', 'rejected')),
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_booking_client_reports_appointment_created
  on public.booking_client_reports (appointment_id, created_at desc);

create index if not exists idx_booking_client_reports_status_created
  on public.booking_client_reports (status, created_at desc);

create index if not exists idx_booking_client_reports_master_created
  on public.booking_client_reports (master_id, created_at desc);

comment on table public.booking_client_reports is
  'Жалобы мастера на клиента после завершённого визита.';
