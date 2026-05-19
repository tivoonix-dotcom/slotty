import {
  isTelegramHelpCommand,
  isTelegramStartCommand,
  sendTelegramHelpReply,
  sendTelegramStartReply,
} from './telegram.webhook.service.js';

export type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id: number };
  };
};

/** Обработка входящих сообщений (/start, /help) — из вебхука или long polling. */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg?.chat?.id) return;

  const text = (msg.text ?? '').trim();
  const chatId = msg.chat.id;

  if (isTelegramStartCommand(text)) {
    await sendTelegramStartReply(chatId, text);
  } else if (isTelegramHelpCommand(text)) {
    await sendTelegramHelpReply(chatId);
  }
}
