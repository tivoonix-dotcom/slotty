-- SLOTTY DB v2 — доставка напоминаний о записи (за сутки и за час)

create table public.appointment_reminder_deliveries (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  reminder_kind text not null,
  sent_at timestamptz not null default now(),
  primary key (appointment_id, reminder_kind),
  constraint appointment_reminder_deliveries_kind_check check (reminder_kind in ('24h', '1h'))
);

create index idx_appointment_reminder_deliveries_sent on public.appointment_reminder_deliveries (sent_at desc);

comment on table public.appointment_reminder_deliveries is 'Факт отправки напоминания (Telegram + in-app) за 24ч и за 1ч до starts_at';
