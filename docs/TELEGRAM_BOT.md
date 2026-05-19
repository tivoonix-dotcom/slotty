# Telegram bot setup

SLOTTY использует Telegram Web App и Bot API для кнопки меню «Открыть SLOTTY» и серверных уведомлений о записях.

## 1. Создать бота

1. В Telegram откройте [@BotFather](https://t.me/BotFather).
2. Команда `/newbot`, задайте имя и username бота.
3. Сохраните выданный **токен** — он понадобится только в `server/.env` (не в коде, не в репозитории, не в чатах).

## 2. Переменные окружения на сервере

В каталоге `server/` создайте или отредактируйте файл `.env` (он в `.gitignore` и не коммитится). Скопируйте шаблон из `server/.env.example` при необходимости.

Обязательно для бота:

- `TELEGRAM_BOT_TOKEN=` — токен от BotFather.
- `WEB_APP_URL=` — **HTTPS**-URL вашего фронтенда (мини-приложение). На проде без HTTPS Web App работает некорректно. Для локальной разработки используйте [ngrok](https://ngrok.com/) или [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) и подставьте выданный `https://...` URL.

Остальные переменные (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_URL` и т.д.) — по `server/.env.example`.

**Чтобы работала команда `/start`**, Telegram должен слать обновления на ваш бэкенд:

| Переменная | Назначение |
|------------|------------|
| `TELEGRAM_WEBHOOK_URL` | Полный URL: `https://ВАШ_API/api/telegram/webhook` |
| или `PUBLIC_API_URL` | `https://ВАШ_API` — путь к вебхуку допишется сам |
| `TELEGRAM_WEBHOOK_SECRET` | Случайная строка (рекомендуется на проде) |
| `TELEGRAM_USE_POLLING=true` | Только локально без HTTPS — long polling вместо вебхука |

На **Railway** у сервиса `server` часто достаточно `TELEGRAM_BOT_TOKEN`, `WEB_APP_URL` и токена: домен подставится из `RAILWAY_PUBLIC_DOMAIN` при старте. Явно задайте `TELEGRAM_WEBHOOK_URL`, если авто-URL не сработал.

На **Railway** те же переменные задаются в **Variables** сервиса с root `server` (см. [RAILWAY.md](./RAILWAY.md)).

## 3. Настройка команд и кнопки меню

Из каталога `server/`:

```bash
cd server
npm run telegram:setup
```

Скрипт вызывает Bot API: команды `/start` и `/help`, кнопку меню Web App, краткое и полное описание бота. В консоли будет отчёт по шагам (OK / FAILED). Токен в лог не выводится.

Запускайте `telegram:setup` только когда в `.env` уже указаны корректные `TELEGRAM_BOT_TOKEN` и `WEB_APP_URL` (с `https://`).

## 4. Проверка в Telegram

1. Откройте своего бота в Telegram.
2. Отправьте **`/start`** — должно прийти приветствие и кнопка **«Открыть SLOTTY»**.
3. Откройте меню (кнопка рядом с полем ввода) и нажмите **«Открыть SLOTTY»** — мини-приложение по `WEB_APP_URL`.

Если `/start` молчит: проверьте логи бэкенда (`setWebhook OK`), что `TELEGRAM_WEBHOOK_SECRET` совпадает с тем, что был при `telegram:setup`, и что API доступен по HTTPS из интернета.

## 5. Утечка токена

Если токен попал в чат, GitHub, лог или скриншот — **сразу отзовите** его в BotFather: `/revoke` для этого бота и получите новый токен. Старый токен перестанет работать.
