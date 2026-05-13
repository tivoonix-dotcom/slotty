import { Router } from 'express';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendTelegramHelpReply, sendTelegramStartReply } from './telegram.webhook.service.js';

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const secret = env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (!secret) {
      res.status(503).type('text').send('webhook disabled: set TELEGRAM_WEBHOOK_SECRET');
      return;
    }

    const header = req.get('X-Telegram-Bot-Api-Secret-Token');
    if (header !== secret) {
      res.status(403).type('text').send('forbidden');
      return;
    }

    const update = req.body as { message?: { text?: string; chat?: { id: number } } };
    const msg = update.message;
    if (!msg?.chat?.id) {
      res.sendStatus(200);
      return;
    }

    const text = (msg.text ?? '').trim();
    const chatId = msg.chat.id;

    if (text.startsWith('/start')) {
      await sendTelegramStartReply(chatId);
    } else if (text.startsWith('/help')) {
      await sendTelegramHelpReply(chatId);
    }

    res.sendStatus(200);
  }),
);
