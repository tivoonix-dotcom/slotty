const TG_API_BASE = 'https://api.telegram.org';

function getBotToken(): string | undefined {
  const raw = process.env.TELEGRAM_BOT_TOKEN;
  const t = typeof raw === 'string' ? raw.trim() : '';
  return t.length > 0 ? t : undefined;
}

function logTelegramFailure(operation: string, message: string): void {
  console.warn(`[telegram] ${operation} failed:`, message);
}

export type SendTelegramMessageResult =
  | { status: 'skipped' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

/** Экранирование для Telegram parse_mode HTML. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(params: {
  telegramUserId: number | string;
  text: string;
}): Promise<SendTelegramMessageResult> {
  const token = getBotToken();
  if (!token) {
    return { status: 'skipped' };
  }

  const chatId = String(params.telegramUserId);

  try {
    const res = await fetch(`${TG_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: params.text,
        parse_mode: 'HTML',
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };

    if (!res.ok || data.ok === false) {
      const msg = data.description?.trim() || `HTTP ${res.status}`;
      logTelegramFailure('sendMessage', msg);
      return { status: 'error', message: msg };
    }

    return { status: 'ok' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network_error';
    logTelegramFailure('sendMessage', msg);
    return { status: 'error', message: msg };
  }
}

type StepResult = { ok: true } | { ok: false; error: string };

async function callBotMethod(token: string, method: string, body: Record<string, unknown>): Promise<StepResult> {
  try {
    const res = await fetch(`${TG_API_BASE}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.description?.trim() || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network_error' };
  }
}

export type SetupTelegramBotReport = {
  commands: StepResult;
  menuButton: StepResult;
  shortDescription: StepResult;
  description: StepResult;
};

export async function setupTelegramBot(params: { webAppUrl: string }): Promise<SetupTelegramBotReport> {
  const token = getBotToken();
  if (!token) {
    const err = { ok: false as const, error: 'TELEGRAM_BOT_TOKEN is not set' };
    return { commands: err, menuButton: err, shortDescription: err, description: err };
  }

  const commands = await callBotMethod(token, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Открыть SLOTTY' },
      { command: 'help', description: 'Помощь' },
    ],
  });

  const menuButton = await callBotMethod(token, 'setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Открыть SLOTTY',
      web_app: { url: params.webAppUrl },
    },
  });

  const shortDescription = await callBotMethod(token, 'setMyShortDescription', {
    short_description: 'SLOTTY — сервис для онлайн-записи к мастерам услуг.',
  });

  const description = await callBotMethod(token, 'setMyDescription', {
    description:
      'SLOTTY помогает быстро найти мастера, выбрать свободное время и записаться на услугу прямо в Telegram. Клиенты видят услуги, цены, адрес и свободные окна, а мастера получают удобный кабинет для управления записями, расписанием и профилем.',
  });

  return { commands, menuButton, shortDescription, description };
}
