-- Расширение адреса мастера: салон, район/метро, приватность «на дому» (без удаления данных).

alter table public.master_locations
  add column if not exists salon_name text,
  add column if not exists district text,
  add column if not exists show_exact_address_after_booking boolean not null default true;

comment on column public.master_locations.salon_name is 'Название салона/студии (visit_type = studio), опционально';
comment on column public.master_locations.district is 'Район или метро (visit_type = at_home), для показа до записи';
comment on column public.master_locations.show_exact_address_after_booking is
  'Для at_home: если false — в каталоге публичный адрес скрыт до записи (точные street/building хранятся)';
