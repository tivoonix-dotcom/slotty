-- Индексы для сводки мастера: записи по master + дата, отзывы по master + статус + дата.

create index if not exists idx_appointments_master_starts_covering
  on public.appointments (master_id, starts_at desc)
  include (status, price_snapshot, service_title_snapshot, client_id);

create index if not exists idx_reviews_master_published_created
  on public.reviews (master_id, created_at desc)
  where status = 'published';
