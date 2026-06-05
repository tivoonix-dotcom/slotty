-- Запись в тот же день: дефолт «в любое время», а не за 24 часа.
alter table public.master_booking_rules
  alter column min_booking_notice_minutes set default 0;

update public.master_booking_rules
   set min_booking_notice_minutes = 0
 where min_booking_notice_minutes = 1440;
