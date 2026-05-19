import 'dotenv/config';
import { setupTelegramBot } from '../modules/telegram/telegram.service.js';
import { resolveTelegramWebhookUrl } from '../modules/telegram/telegram.webhookConfig.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`${name} is required. Set it in server/.env`);
    process.exit(1);
  }
  return String(v).trim();
}

function printStep(label: string, result: { ok: true } | { ok: false; error: string }): void {
  if (result.ok) {
    console.log(`${label}: OK`);
  } else {
    console.log(`${label}: FAILED — ${result.error}`);
  }
}

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required in server/.env');
    process.exit(1);
  }

  const webAppUrl = requireEnv('WEB_APP_URL');
  if (!webAppUrl.startsWith('https://')) {
    console.error('WEB_APP_URL must start with https:// (Telegram Web App requirement).');
    process.exit(1);
  }

  const webhookUrl = resolveTelegramWebhookUrl();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!webhookUrl) {
    console.error(
      'Задайте TELEGRAM_WEBHOOK_URL=https://ВАШ_API_HOST/api/telegram/webhook\n' +
        'или PUBLIC_API_URL=https://ВАШ_API_HOST (Railway: домен сервиса slotty-api).',
    );
    process.exit(1);
  }
  if (!webhookSecret) {
    console.warn(
      'TELEGRAM_WEBHOOK_SECRET не задан — вебхук без secret_token (для продакшена лучше задать секрет).',
    );
  }

  console.log('Webhook URL:', webhookUrl);

  const report = await setupTelegramBot({
    webAppUrl,
    webhookUrl,
    webhookSecret: webhookSecret || undefined,
  });

  printStep('commands set', report.commands);
  printStep('menu button set', report.menuButton);
  printStep('short description set', report.shortDescription);
  printStep('description set', report.description);
  if (report.webhook) {
    printStep('webhook set', report.webhook);
  }

  const failed =
    !report.commands.ok ||
    !report.menuButton.ok ||
    !report.shortDescription.ok ||
    !report.description.ok ||
    (report.webhook !== undefined && !report.webhook.ok);
  if (failed) {
    process.exit(1);
  }
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
