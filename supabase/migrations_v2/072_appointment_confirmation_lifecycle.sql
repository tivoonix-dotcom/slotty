-- Дедлайны подтверждения pending-заявок и расширение notification_jobs.

alter table public.appointments
  add column if not exists pending_expires_at timestamptz,
  add column if not exists confirmed_at timestamptz;

create index if not exists idx_appointments_pending_expires
  on public.appointments (pending_expires_at)
  where status = 'pending' and pending_expires_at is not null;

comment on column public.appointments.pending_expires_at is 'Когда pending-заявка автоматически истечёт без ответа мастера';
comment on column public.appointments.confirmed_at is 'Когда мастер подтвердил запись';

alter table public.notification_jobs drop constraint if exists notification_jobs_type_check;

alter table public.notification_jobs add constraint notification_jobs_type_check check (
  job_type in (
    'booking_client_pending',
    'booking_master_new',
    'booking_client_confirmed',
    'booking_client_cancelled',
    'booking_master_client_cancelled',
    'booking_reminder_1h',
    'booking_reminder_24h',
    'booking_visit_start',
    'booking_master_pending_reminder',
    'booking_master_pending_deadline'
  )
);
