-- SLOTTY DB v2 — журнал применённых миграций (служебная таблица).
-- RLS не включаем: таблица используется только при подключении с правами postgres / service_role
-- через скрипт деплоя; для anon/authenticated в PostgREST доступ не открываем.

create table if not exists public.schema_migrations_v2 (
  id bigserial primary key,
  filename text not null,
  checksum text,
  applied_at timestamptz not null default now(),
  constraint schema_migrations_v2_filename_key unique (filename)
);

comment on table public.schema_migrations_v2 is 'Applied SQL migration files from supabase/migrations_v2 (numbered NNN_*.sql)';
