-- Snapshot данных записи в in-app уведомлениях (fallback при недоступном live fetch).

alter table public.notifications
  add column if not exists metadata jsonb null;

comment on column public.notifications.metadata is
  'Snapshot booking-данных на момент уведомления; UI предпочитает fresh fetch по bookingId/code.';
