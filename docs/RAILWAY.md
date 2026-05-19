# Деплой SLOTTY на Railway (фронт + бэк + Telegram)

В текущей архитектуре **отдельного процесса «бота» нет**: Bot API вызывается из **бэкенда** (уведомления, проверка `initData`). Команды меню Web App настраиваются **один раз** скриптом `npm run telegram:setup` (см. [TELEGRAM_BOT.md](./TELEGRAM_BOT.md)).

На Railway делается **один проект** и **два сервиса** из одного репозитория:

| Сервис | Root Directory | Build | Start | Назначение |
|--------|----------------|-------|-------|------------|
| **slotty-web** | `/` (корень репо) | `npm run build` | `npm start` | Статика Vite (`dist/`) через `scripts/static-serve.mjs` |
| **slotty-api** | `server` | `npm run build` | `npm start` | Express API |

Оба получают **публичный HTTPS URL** от Railway (домен вида `*.up.railway.app` или свой).

---

## 1. Проект и репозиторий

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → репозиторий **slotty** (например `tivoonix-dotcom/slotty`).
2. Первый деплой создаст один сервис — переименуйте, например, в **slotty-api** или сразу настройте корень (см. ниже).

---

## 2. Сервис бэкенда (`server`)

1. **Settings** → **Root Directory** → **`server`**.
2. **Variables** (минимум):

   | Переменная | Пример / комментарий |
   |------------|----------------------|
   | `DATABASE_URL` | Postgres (Railway **Add Plugin → PostgreSQL** и привязка к сервису, либо внешний Supabase). |
   | `JWT_SECRET` | Случайная строка **≥ 16** символов. |
   | `CLIENT_URL` | Публичный URL **фронта** (после шага 3), например `https://slotty-web-production.up.railway.app`. |
   | `TELEGRAM_BOT_TOKEN` | Токен от BotFather (только в Variables, не в git). |
   | `WEB_APP_URL` | Тот же URL, что и фронт (HTTPS), для кнопки Web App в Telegram. |
   | `TELEGRAM_WEBHOOK_URL` | `https://ВАШ_API_ДОМЕН/api/telegram/webhook` — для команды **/start** (или задайте `PUBLIC_API_URL` = URL API без `/api`). |
   | `TELEGRAM_WEBHOOK_SECRET` | Случайная строка (опционально, но рекомендуется). |
   | `PORT` | Обычно **не задавать** — Railway подставит сам. |

3. **Deploy** → дождаться **Public Networking** → **Generate Domain** → скопируйте URL API, например `https://slotty-api-production-xxxx.up.railway.app`.

Проверка: в браузере `https://…/api/health` (или ваш health path) должен отвечать.

---

## 3. Сервис фронта (корень репо)

1. В том же проекте: **New** → **GitHub Repo** → тот же репозиторий (второй сервис).
2. **Settings** → **Root Directory** → **пусто или `.`** (корень, **не** `server`).
3. **Variables**:

   | Переменная | Значение |
   |------------|----------|
   | `VITE_API_URL` | URL бэкенда **без** `/api` в конце, например `https://slotty-api-production-xxxx.up.railway.app` |
   | `VITE_PUBLIC_APP_URL` | Канонический URL для ссылок клиентам, например `https://slotty.of.by` (без слэша в конце). Если не задан — в production подставляется `https://slotty.of.by` даже при открытии кабинета с Railway-домена. |

4. **Build Command**: `npm run build`  
5. **Start Command**: `npm start` (в корневом `package.json` это `node ./scripts/static-serve.mjs`, слушает `PORT` и отдаёт `dist/` с SPA fallback).

6. **Generate Domain** для фронта → этот URL вставьте в **`CLIENT_URL`** и **`WEB_APP_URL`** бэкенда (и при необходимости перезапустите деплой бэка).

7. Пересоберите фронт, если меняли `VITE_API_URL` после первого деплоя.

---

## 4. Telegram («бот»)

1. После того как известны **оба** HTTPS URL (фронт и, при желании, только фронт для `WEB_APP_URL`):
   - `WEB_APP_URL` = URL **фронта** (мини-приложение).
   - `CLIENT_URL` = тот же origin фронта (для CORS).

2. Один раз настройте команды меню у BotFather через скрипт (локально или в **Railway Shell** у сервиса `server`, с теми же env):

   ```bash
   cd server
   npm ci
   npm run telegram:setup
   ```

   Нужны `TELEGRAM_BOT_TOKEN`, `WEB_APP_URL` (https) и URL вебхука (см. таблицу выше).

3. После деплоя бэкенд **сам** вызывает `setWebhook` при старте (если задан `TELEGRAM_WEBHOOK_URL` или `PUBLIC_API_URL` / `RAILWAY_PUBLIC_DOMAIN`). В логах должно быть: `[telegram] setWebhook OK → …`

4. В боте отправьте **`/start`** — приветствие и кнопка Web App.

Уведомления о записях идут **автоматически** с бэкенда при работающем `TELEGRAM_BOT_TOKEN`.

---

## 5. Частые проблемы

- **Unexposed service / 502 / 500 в браузере**: во вкладке **Networking** включите **Public Networking** и нажмите **Generate Domain** — иначе сервис с интернета не открывается. Проверка: `GET https://ваш-домен/health` → ответ `ok`.
- **CORS**: `CLIENT_URL` на бэке должен **точно** совпадать с origin фронта (со схемой `https://`, без лишнего слэша в конце — как в браузере).
- **Mixed content**: фронт на https → `VITE_API_URL` тоже **https** (Railway домен даёт https).
- **Порт 4000**: на Railway не используйте фиксированный порт в проде — только `PORT` от платформы (у вас в `server` уже `env.PORT`).

---

## 6. Альтернатива

Фронт можно оставить на **Vercel**, а на Railway — **только `server`**. Тогда `CLIENT_URL` / `WEB_APP_URL` = Vercel, `VITE_API_URL` = Railway API.
