-- Быстрая отмена pending-напоминаний при confirm/cancel записи.

create index if not exists idx_notification_jobs_appointment_pending
  on public.notification_jobs (appointment_id)
  where status = 'pending';
