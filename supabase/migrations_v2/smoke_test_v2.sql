-- SLOTTY DB v2 — быстрые read-only проверки после baseline / миграций.
-- Запуск: npm run db:v2:smoke  (или вручную в SQL Editor с ролью postgres).

do $$
begin
  if not exists (
    select
      1
    from
      information_schema.tables
    where
      table_schema = 'public'
      and table_name = 'schema_migrations_v2'
  ) then
    raise exception 'schema_migrations_v2 отсутствует (сначала npm run db:v2:baseline или миграция 000)';
  end if;

  if not exists (
    select
      1
    from
      information_schema.tables
    where
      table_schema = 'public'
      and table_name = 'master_profiles'
  ) then
    raise exception 'master_profiles отсутствует';
  end if;

  if not exists (
    select
      1
    from
      pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
    where
      n.nspname = 'public'
      and p.proname = 'create_appointment_atomic'
  ) then
    raise exception 'функция create_appointment_atomic не найдена';
  end if;
end;

$$;

select 'smoke_test_v2: OK' as result;
