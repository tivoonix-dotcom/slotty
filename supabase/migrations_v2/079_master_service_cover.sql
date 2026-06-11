-- Обложка услуги мастера: URL + точка фокуса для object-position в каталоге.

alter table public.master_services
  add column if not exists cover_image_url text,
  add column if not exists cover_image_focal_x smallint not null default 50,
  add column if not exists cover_image_focal_y smallint not null default 50;

alter table public.master_services
  drop constraint if exists master_services_cover_focal_x_range;

alter table public.master_services
  add constraint master_services_cover_focal_x_range
  check (cover_image_focal_x >= 0 and cover_image_focal_x <= 100);

alter table public.master_services
  drop constraint if exists master_services_cover_focal_y_range;

alter table public.master_services
  add constraint master_services_cover_focal_y_range
  check (cover_image_focal_y >= 0 and cover_image_focal_y <= 100);

comment on column public.master_services.cover_image_url is
  'Публичное фото услуги для карточки каталога (обязательно для активных услуг).';
comment on column public.master_services.cover_image_focal_x is
  'Горизонтальная точка кадрирования 0–100 (CSS object-position).';
comment on column public.master_services.cover_image_focal_y is
  'Вертикальная точка кадрирования 0–100 (CSS object-position).';
