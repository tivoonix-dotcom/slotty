# Интеграция bePaid — SLOTTY

## Магазин в CRM bePaid

| Параметр | Значение |
|----------|----------|
| Домен | `slotty.of.by` |
| Shop / Merchant ID | `35495` |
| Валюта | `BYN` |
| 3-D Secure | включён |
| Бренды (по CRM) | Visa, Mastercard, Белкарт, МИР, Apple Pay, Samsung Pay |

## URL в настройках магазина

| Назначение | URL |
|------------|-----|
| Success | `https://slotty.of.by/payment/success` |
| Fail | `https://slotty.of.by/payment/fail` |
| Notification (webhook) | `https://<ВАШ_API_ХОСТ>/api/payments/bepaid/webhook` |

Пример для production API:

`https://slotty-api-production.up.railway.app/api/payments/bepaid/webhook`

Либо задайте `BEPAID_NOTIFICATION_URL` в `server/.env` целиком.

## Секреты (только backend)

1. **Secret Key** — из CRM bePaid → `BEPAID_SECRET_KEY` в `server/.env` (не коммитить).
2. **Public Key** — если нужен виджет на фронте → `BEPAID_PUBLIC_KEY` (не отдавать secret на клиент).
3. **Webhook** — Basic Auth (Shop ID + Secret Key) и/или `BEPAID_WEBHOOK_SECRET` в заголовке `X-Webhook-Secret`.

Не храните в репозитории: скриншоты CRM с ключами, email/телефон из CRM в коде.

## Переменные окружения

См. `server/.env.example` (префикс `BEPAID_*`).

`BEPAID_ENABLED=true` — только после проверки sandbox и миграции `052_payments_bepaid.sql`.

## Backend API

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/payments/bepaid/create` | Создать платёж + checkout (auth) |
| POST | `/api/payments/bepaid/webhook` | Webhook bePaid |
| GET | `/api/payments/:id` | Статус платежа |
| GET | `/api/admin/payments` | Список (platform_admin) |
| GET | `/api/admin/payments/:id` | Детали + история статусов |

## Поток

1. Backend создаёт запись `payments` со статусом `pending`.
2. Запрос в `https://checkout.bepaid.by/ctp/api/checkouts` → `redirect_url` для клиента.
3. Клиент платит на стороне bePaid (3-D Secure).
4. bePaid шлёт webhook → backend обновляет статус (источник правды).
5. При `success` + `master_pro_plan` — активация Pro в `master_subscriptions`.

Страницы `/payment/success` и `/payment/fail` **не подтверждают** оплату — только UX.

## Типы платежей

- `master_pro_plan` — оплата тарифа Pro мастером (реализовано).
- `appointment_prepayment` — заготовка (API возвращает ошибку до включения продукта).

## Миграция БД

```bash
npm run db:v2:migrate
```

Файл: `supabase/migrations_v2/052_payments_bepaid.sql`

## Админка

Платформенная админка: `/platform-admin/payments` (список и карточка платежа).

## Sandbox

`BEPAID_ENV=sandbox` → в checkout передаётся `test: true`.

Перед боевым запуском: тестовый платёж, проверка webhook, idempotency (повторный webhook).

## Автопродление (MIT recurring)

1. В checkout передаётся `additional_data.contract: ['recurring']`.
2. В webhook при успехе сохраняется `credit_card.token` → `master_subscriptions.provider_card_token`.
3. `BEPAID_RECURRING_ENABLED=true` — billing worker списывает по токену через `POST https://gateway.bepaid.by/transactions/payments`.
4. Без recurring в CRM / без токена — только ручное продление; в UI не обещаем автосписание (`autoRenewLegalAllowed=false`).

Миграции: `060_master_subscription_saas.sql`, `061_subscription_billing_jobs.sql`.

Smoke: `npm run staging:billing-saas --prefix server`
