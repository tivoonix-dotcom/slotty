import { Router } from 'express';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { handleTelegramUpdate } from './telegram.updateHandler.js';

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const secret = env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (secret) {
      const header = req.get('X-Telegram-Bot-Api-Secret-Token');
      if (header !== secret) {
        console.warn(
          '[telegram webhook] 403: неверный X-Telegram-Bot-Api-Secret-Token. ' +
            'Перезапустите npm run telegram:setup или совпадите TELEGRAM_WEBHOOK_SECRET с setWebhook.',
        );
        res.status(403).type('text').send('forbidden');
        return;
      }
    } else if (env.NODE_ENV === 'production') {
      console.warn(
        '[telegram webhook] TELEGRAM_WEBHOOK_SECRET не задан — запросы без проверки заголовка (рекомендуется задать секрет).',
      );
    }

    try {
      await handleTelegramUpdate(req.body);
    } catch (e) {
      console.warn('[telegram webhook] handler error:', e instanceof Error ? e.message : e);
    }

    res.sendStatus(200);
  }),
);
