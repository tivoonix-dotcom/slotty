# SLOTTY `migrations_v2` — журнал и скрипты

## Что уже могло быть применено

Файлы **`001`–`013`** вы могли выполнить вручную или старым скриптом. Повторно гонять их **нельзя** (типы и таблицы уже есть). Для такой БД нужен **один раз** baseline.

## Команды (v2)

| Команда | Назначение |
|---------|------------|
| `npm run db:v2:baseline` | Создать `public.schema_migrations_v2` (SQL из `000_migration_history.sql`) и **пометить применёнными только `001`–`013`** без повторного выполнения их SQL. Запись для `000` в журнал **не** добавляется — её добавит первый `db:v2:migrate` (повторный запуск `000` безопасен: `CREATE TABLE IF NOT EXISTS`). |
| `npm run db:v2:migrate` | Применить только те `NNN_*.sql`, которых **нет** в `schema_migrations_v2`. |
| `npm run db:v2:status` | Список applied / pending / ignored. |
| `npm run db:v2:smoke` | Выполнить `smoke_test_v2.sql` (проверки, **не** пишется в журнал). |

**Пароль к БД:** переменная `SUPABASE_DB_PASSWORD`, строка в `.env`, или первая строка **`dbpass.txt`** (файл в `.gitignore`). Скрипт **не выводит** пароль и DSN.

**Старый v1:** `npm run db:apply` по-прежнему применяет только `supabase/schema.sql` — для **v2** используйте команды **`db:v2:*`**.

## Какие файлы участвуют в миграциях

- В журнал и в `db:v2:migrate` попадают только имена вида **`NNN_что-то.sql`** (`000`–`999`).
- **Не** участвуют в автоматическом migrate: `apply_all_v2.sql`, `smoke_test_v2.sql`, `README.md`, `manual_test_plan.md` и любые файлы без префикса `NNN_`.
- **`apply_all_v2.sql`** — только для ручной вставки в SQL Editor на **пустой** тестовой БД; в обычной разработке **не** использовать вместо `db:v2:migrate`.
- **`smoke_test_v2.sql`** — опциональная проверка после baseline / миграций; запуск: `npm run db:v2:smoke`.

## Таблица журнала

`public.schema_migrations_v2` создаётся файлом **`000_migration_history.sql`**. RLS на неё **не** включён: таблица служебная для деплоя с ролью postgres / pooler; в PostgREST к ней доступ не настраиваем.

## Совместимость с v1

`supabase/schema.sql` (v1) **конфликтует** с v2 по именам (`profiles`, enum `user_role`, триггер `on_auth_user_created` и т.д.). v2 рассчитан на **отдельный** проект Supabase или заранее очищенную `public`.

## Новые миграции

Файл **`014_standalone_profiles.sql`** переводит **`public.profiles`** на **standalone backend**: снимает FK на **`auth.users`**, задаёт **`DEFAULT gen_random_uuid()`** для **`id`**, удаляет триггер **`on_auth_user_created`** и функцию **`handle_new_user`**. Дальше добавляйте **`015_....sql`** и т.д. Затем:

```bash
npm run db:v2:migrate
```

Подробнее — `docs/DATABASE_V2.md`, раздел «Как запускать будущие миграции».
