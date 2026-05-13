import { Router } from 'express';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendTelegramHelpReply, sendTelegramStartReply, isTelegramHelpCommand, isTelegramStartCommand } from './telegram.webhook.service.js';

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const secret = env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (secret) {
      const header = req.get('X-Telegram-Bot-Api-Secret-Token');
      if (header !== secret) {
        res.status(403).type('text').send('forbidden');
        return;
      }
    } else if (env.NODE_ENV === 'production') {
      console.warn(
        '[telegram webhook] TELEGRAM_WEBHOOK_SECRET не задан — запросы без проверки заголовка (рекомендуется задать секрет).',
      );
    }

    const update = req.body as { message?: { text?: string; chat?: { id: number } } };
    const msg = update.message;
    if (!msg?.chat?.id) {
      res.sendStatus(200);
      return;
    }

    const text = (msg.text ?? '').trim();
    const chatId = msg.chat.id;

    try {
      if (isTelegramStartCommand(text)) {
        await sendTelegramStartReply(chatId);
      } else if (isTelegramHelpCommand(text)) {
        await sendTelegramHelpReply(chatId);
      }
    } catch (e) {
      console.warn('[telegram webhook] handler error:', e instanceof Error ? e.message : e);
    }

    res.sendStatus(200);
  }),
);
