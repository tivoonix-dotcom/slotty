-- Индексы для KPI platform-admin overview (COUNT по датам и статусам).

create index if not exists idx_appointments_starts_at
  on public.appointments (starts_at);

create index if not exists idx_appointments_cancelled_updated
  on public.appointments (updated_at)
  where status in ('cancelled_by_client', 'cancelled_by_master');

create index if not exists idx_category_change_requests_status
  on public.category_change_requests (status)
  where status = 'pending';

create index if not exists idx_sponsor_requests_status
  on public.sponsor_requests (status)
  where status in ('pending', 'in_review');

create index if not exists idx_master_slots_master_starts
  on public.master_availability_slots (master_id, starts_at desc);
