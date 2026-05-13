# SLOTTY — база данных v2 (Supabase / PostgreSQL)

Этот документ описывает схему **`migrations_v2`**, отдельную от устаревшего файла `supabase/schema.sql`. Старая схема **не изменяется** в репозитории. Перед применением v2 прочитайте раздел «Совместимость с v1».

---

## 1. Финальная структура

Все объекты создаются в схеме **`public`** (стандарт Supabase). Идентификаторы — **`uuid`**, время — **`timestamptz`**, деньги — **`numeric(12,2)`**.

### 1.1 Список таблиц

| Таблица | Назначение |
|---------|------------|
| `profiles` | Профиль пользователя (**standalone**, без `auth.users` с миграции **`014`**) |
| `telegram_identities` | Опционально: 1:1 привязка Telegram ↔ профиль (аудит, единый источник tg id) |
| `master_profiles` | Публичный профиль мастера (`master_id` = PK = FK на `profiles`) |
| `service_categories` | Справочник категорий услуг |
| `master_services` | Услуги мастера |
| `master_locations` | Адреса / точки приёма |
| `master_schedule_rules` | Регулярное расписание по дням недели |
| `master_availability_slots` | Конкретные окна в календаре |
| `appointments` | Записи клиентов (со snapshot полей услуги) |
| `favorite_masters` | Избранные мастера клиента |
| `reviews` | Отзывы (1:1 с завершённой записью по `appointment_id`) |
| `notifications` | Уведомления пользователя |
| `master_portfolio_items` | Портфолио |
| `master_certificates` | Сертификаты |
| `master_career_items` | Образование и опыт |
| `master_booking_rules` | Тексты правил записи / отмены / оплаты |
| `payment_methods` | Справочник способов оплаты |
| `master_payment_methods` | Связь мастер ↔ способ оплаты |
| `subscription_plans` | Тарифы Free / Pro (лимиты колонками) |
| `master_subscriptions` | Подписка мастера на план |
| `booking_vouchers` | Талон: номер + ссылка на PDF (опционально) |
| `schema_migrations_v2` | Журнал применённых файлов `NNN_*.sql` (служебная, без RLS) |

### 1.2 Связи (кратко)

- **`profiles`**: первичный ключ `id` (**`uuid`**, default `gen_random_uuid()` после **`014`**). Раньше (до **`014`**) в шаблоне v2 был FK на `auth.users` — для SLOTTY backend этот FK снят; профиль создаётся приложением после проверки Telegram **initData**.
- **`profiles` 1:0..1 `master_profiles`**: у мастера есть строка в `master_profiles` с **`master_id = profiles.id`** (PK мастера = id пользователя).
- **Мастер 1:N** услуги, локации, правила недели, слоты, портфолио, сертификаты, карьера, `master_booking_rules`, `master_payment_methods`, подписка.
- **Клиент M:N мастера** через `favorite_masters`.
- **`appointments`**: `client_id` → `profiles`, `master_id` → `master_profiles`, `service_id` → `master_services`, **`slot_id` → `master_availability_slots` (UNIQUE)**.
- **`reviews`**: FK на `appointments`, **`appointment_id` UNIQUE**.
- **`booking_vouchers`**: FK на `appointments` (1:1).

Диаграмма логики (после **`014`**, упрощённо):

```text
profiles (standalone, Telegram + JWT backend)
     │
     ├──1:1── telegram_identities (опц.)
     │
     └──1:0..1── master_profiles (master_id PK)
                    ├──1:N── master_services … slots …
                    └──1:N── appointments ← client_id (profiles)
```

**Legacy (не используются напрямую текущим Express + `pg` backend):** RLS-политики и RPC вроде **`create_appointment_atomic`**, где задействован **`auth.uid()`** и роль PostgREST **`authenticated`**. Основной продуктовый путь записи — **Node.js (Express) + JWT + прямые SQL-транзакции** (см. `server/`). Объекты в БД могут оставаться для совместимости или будущего PostgREST, но не являются источником истины для нового backend.

---

## 2. MVP vs позже

### MVP (минимум для «настоящей» записи и кабинета)

- `profiles`, `master_profiles`, `service_categories`, `master_services`
- `master_locations`, `master_schedule_rules`, `master_availability_slots`
- `appointments`, `favorite_masters`
- `master_booking_rules`, `payment_methods`, `master_payment_methods`
- `subscription_plans`, `master_subscriptions`
- `notifications`, `booking_vouchers`
- RPC `create_appointment_atomic` (legacy для PostgREST / `auth.uid()`), RLS, триггеры `updated_at`
- ~~`handle_new_user` + триггер `on_auth_user_created`~~ — **удалены миграцией `014`** при переходе на standalone backend

### Можно подключать позже (уже в схеме, но не обязательны для первого релиза)

- `reviews` (если отзывы отложены)
- `master_portfolio_items`, `master_certificates`, `master_career_items` (если сначала только текст в `master_profiles.bio`)
- `telegram_identities` (если достаточно `profiles.telegram_user_id`)

---

## 3. Замена localStorage

| Ключ localStorage | Таблица(ы) v2 |
|-------------------|----------------|
| `slotty_master_draft` | `master_profiles`, `master_services`, `master_locations`, `master_schedule_rules`, `master_booking_rules`, `master_payment_methods`, trust-таблицы |
| `slotty_is_master` | `profiles.role = 'master'` + наличие `master_profiles` |
| `slotty_favorite_master_ids_v1` | `favorite_masters` |
| `slotty_master_plan` | `master_subscriptions` + `subscription_plans` |
| `slotty_master_appointments_demo` | `appointments` (+ при необходимости слоты) |

Фронт **пока не переключается** — это план миграции данных и UI.

---

## 4. Замена demo-файлов запросами

| Файл / область | Замена |
|----------------|--------|
| `src/features/services/model/demoMasters.ts` | `master_profiles` + join услуг, слотов, агрегатов |
| `src/features/services/model/demoMasterLocations.ts` | `master_locations` |
| `src/features/booking/model/demoBookingSlotGrid.ts` | `master_availability_slots` (+ генератор по `master_schedule_rules` на сервере) |
| `src/features/appointments/model/demoAppointments.ts` | `appointments` для клиента |
| `src/features/master/model/demoMasterAppointments.ts` | `appointments` для мастера |
| `src/features/billing/model/masterPlans.ts` | `subscription_plans` / `master_subscriptions` |
| Уведомления в `ProfilePage` | `notifications` |

---

## 5. Запись клиента через слот

1. Мастер создаёт окна в **`master_availability_slots`** (`status = available`, `service_id` может быть `NULL`).
2. Клиент выбирает слот и услугу; клиент **не** обновляет слот напрямую.
3. Вызывается **`create_appointment_atomic(p_slot_id, p_service_id, p_client_note)`** (SECURITY DEFINER).
4. В одной транзакции: `SELECT … FROM master_availability_slots WHERE id = p_slot_id **FOR UPDATE**` → проверки → `INSERT appointments` → `UPDATE slot SET booked` → уведомления → талон в **`booking_vouchers`**.
5. При любой ошибке транзакция откатывается: слот **не** остаётся `booked`.

**MVP по длительности:** RPC проверяет, что услуга **помещается** в `[slot.starts_at, slot.ends_at]`. Интервал записи в **`appointments`**: `starts_at = slot.starts_at`, **`ends_at = slot.starts_at + service.duration_minutes`** (как в ТЗ RPC). Окно слота при этом целиком помечается **`booked`**, чтобы не было второй записи на то же окно (пока не реализована отмена с возвратом слота).

---

## 6. Соответствие 3НФ

- Справочники вынесены: **`service_categories`**, **`payment_methods`**, **`subscription_plans`**.
- Атрибуты мастера не смешаны с атрибутами клиента: отдельно **`profiles`** и **`master_profiles`**.
- Адрес и правила записи не дублируют поля карточки: **`master_locations`**, **`master_booking_rules`**.
- Окно времени — отдельная сущность **`master_availability_slots`**, запись ссылается на него FK + **`UNIQUE(slot_id)`**.
- **Snapshot** в `appointments` — намеренная денормализация **факта записи** (цена, название, длительность на момент брони); актуальная услуга остаётся в `master_services`.

---

## 7. Зачем `telegram_identities`, если в `profiles` уже есть Telegram?

В **`profiles`** хранятся **`telegram_user_id`** / **`telegram_username`** для быстрых запросов и логина через **Telegram Web App** (проверка **initData** на backend, без Supabase Auth).

**`telegram_identities`** (1:1 с `profiles`) добавлена как **опциональный** слой для:

- явного аудита «когда последний раз подтверждали initData» (`last_init_validated_at`);
- будущего сценария смены / верификации аккаунта без перегрузки `profiles` дополнительными полями.

Если не нужна — можно не создавать таблицу в своём форке; в поставляемых миграциях она включена с минимальным набором полей.

---

## 8. Риски и ручные проверки перед применением

### Конфликт с `supabase/schema.sql` (v1)

Обе схемы используют **`public.profiles`**, **`public.user_role`** и т.д. **На одной и той же БД нельзя просто наложить v2 поверх v1** без удаления/переименования старых объектов.

**Рекомендация:** отдельный проект Supabase / пустая БД / дроп legacy вручную по чеклисту.

### Триггер `on_auth_user_created` и `handle_new_user`

До миграции **`014`** в типовом наборе v2 на **`auth.users`** мог висеть триггер **`on_auth_user_created`**, создающий строку в **`public.profiles`** через **`public.handle_new_user`**. После **`014`** триггер и функция **удаляются**: профили создаёт **standalone backend** (см. `server/src/modules/auth/auth.service.ts`).

### RLS и RPC (legacy)

- Клиент **не** должен иметь прямой `INSERT` в `appointments` (политика запрещена); в классическом PostgREST-потоке допускался только RPC.
- Функция **`create_appointment_atomic`** использует **`auth.uid()`** — это **legacy** относительно текущего **Express + JWT** backend; новый сервер реализует ту же бизнес-логику в приложении.
- Функция **SECURITY DEFINER** — владелец должен быть надёжным; выдавать **`EXECUTE`** только `authenticated` (или через PostgREST), если вы всё ещё вызываете RPC из Supabase.

### Отмена записи и слот

В v2 RPC создаёт **`booked`** слот без обратного перехода в `available` при отмене — отдельная миграция/функция `cancel_appointment` понадобится позже.

### Индексы и нагрузка

Частичный индекс по `available` ускоряет каталог; при миллионах слотов понадобится партиционирование по дате.

---

## 9. Как запускать будущие миграции

1. **Журнал:** таблица **`public.schema_migrations_v2`** создаётся файлом **`000_migration_history.sql`** и хранит **`filename`**, **`checksum`** (SHA-256 содержимого файла), **`applied_at`**.
2. **Если `001`–`013` уже применены вручную** (как у вас): один раз выполните  
   `npm run db:v2:baseline` — создастся журнал и в него попадут только записи для **`001`–`013`** (SQL этих файлов **не** выполняется). Запись для **`000`** в baseline **не** добавляется; при следующем `npm run db:v2:migrate` выполнится только **`000_migration_history.sql`** (идемпотентно) и строка `000` попадёт в журнал.
3. **Дальше:** добавляйте **`014_*.sql`**, **`015_*.sql`** … и запускайте **`npm run db:v2:migrate`** — скрипт применит только отсутствующие в журнале файлы, в порядке имён. При ошибке выполнение останавливается, **запись в журнал для упавшего файла не пишется**.
4. **С `014`:** схема **`public.profiles`** переводится на **standalone backend** (снятие FK на `auth.users`, default **`gen_random_uuid()`** на `profiles.id`, удаление триггера **`on_auth_user_created`** и **`handle_new_user`**). Подробности — файл **`014_standalone_profiles.sql`**.
5. **Статус:** `npm run db:v2:status` — applied / pending / ignored.
6. **Проверка:** `npm run db:v2:smoke` — выполняет `smoke_test_v2.sql`, в журнал **не** записывается.
7. **Не использовать** для обычного цикла разработки: **`apply_all_v2.sql`** (дублирует все миграции; только для ручного прогона на пустой БД, если нужно).

Список файлов `001`–`013` по смыслу — прежний; плюс в репозитории добавлен **`000_migration_history.sql`** и миграция **`014_standalone_profiles.sql`**.

**Старый скрипт v1:** `npm run db:apply` применяет только **`supabase/schema.sql`** — для **v2** используйте **`npm run db:v2:*`**.

---

## 10. Файлы миграций (содержимое 000–014)

Каталог: **`supabase/migrations_v2/`**

| Файл | Содержимое |
|------|------------|
| `000_migration_history.sql` | Таблица `schema_migrations_v2` |
| `001_extensions_and_enums.sql` | `pgcrypto`, все enum |
| `002_profiles.sql` | `profiles`, `telegram_identities` |
| `003_masters_and_categories.sql` | `service_categories`, `master_profiles` |
| `004_services_locations_rules.sql` | `master_services`, `master_locations`, `master_schedule_rules`, `master_booking_rules` |
| `005_schedule_and_slots.sql` | `master_availability_slots` |
| `006_appointments.sql` | `appointments` |
| `007_favorites_reviews_notifications.sql` | избранное, отзывы, уведомления |
| `008_trust_profile.sql` | портфолио, сертификаты, карьера |
| `009_billing_and_vouchers.sql` | оплата, тарифы, подписки, `booking_vouchers` |
| `010_triggers_and_indexes.sql` | `updated_at`, ~~`handle_new_user`~~ (удаляется в **`014`**), агрегаты отзывов |
| `011_rls_policies.sql` | RLS |
| `012_seed.sql` | категории, способы оплаты, планы |
| `013_rpc_create_appointment_atomic.sql` | RPC бронирования + `GRANT EXECUTE` (legacy `auth.uid()`) |
| `014_standalone_profiles.sql` | **Standalone auth:** снятие FK `profiles`→`auth.users`, default `id`, удаление `on_auth_user_created` / `handle_new_user`, комментарии |

**Не выполнять** для v2 **`npm run db:apply`** — он нацелен на **`supabase/schema.sql`** (v1).

---

## 12. Тарифы и лимиты (backend)

- **Каталог планов:** `GET /api/billing/plans` — активные строки из `subscription_plans` (цены и лимиты в camelCase).
- **Подписка мастера:** `GET /api/masters/me/subscription` — текущая подписка; при отсутствии строки создаётся **Free** (`INSERT … ON CONFLICT DO NOTHING`).
- **Временное переключение тарифа без оплаты:** `PATCH /api/masters/me/subscription/mock` с телом `{ planCode, billingPeriod }`. Включено в **development** и **test**; в **production** — только если задано `ALLOW_SUBSCRIPTION_MOCK=true`. Настоящая оплата — отдельный этап (платёжный провайдер + webhook).
- **Лимиты на сервере:**
  - `POST /api/masters/me/services` — считаются только **активные** услуги; при превышении `max_services` → **403** `LIMIT_SERVICES_REACHED`;
  - `POST` / `PATCH` слотов мастера — горизонт `max_schedule_days_ahead` от «сейчас» → **403** `LIMIT_SCHEDULE_DAYS_REACHED`;
  - `POST /api/appointments` — записи мастера в **текущем календарном месяце** (`date_trunc('month', now())`), без отмен клиентом/мастером; при превышении `max_monthly_appointments` → **403** `LIMIT_MONTHLY_APPOINTMENTS_REACHED`.
- Кабинет «Тарифы» при живом мастере читает планы и подписку с API; при ошибке загрузки — **demo/localStorage** fallback.

---

## 13. Краткий вывод

- v2 — **нормализованное** ядро записи: слот → атомарная запись → талон + уведомления.
- **`master_profiles.master_id`** — единый PK/FK для всех дочерних таблиц мастера.
- С **`014`**: **`profiles`** живут без **`auth.users`**; вход через **Telegram Web App** и **JWT** обслуживает **Node.js** backend (`Express` + `pg`).
- Настройка Telegram-бота (меню Web App, уведомления): **[TELEGRAM_BOT.md](./TELEGRAM_BOT.md)**.
- Деплой на Railway (фронт + API в одном проекте): **[RAILWAY.md](./RAILWAY.md)**.
- Старая **`supabase/schema.sql`** остаётся архивом v1; v2 живёт отдельно до решения о cutover.
