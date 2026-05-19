import { env } from '../../config/env.js';

const TG_API_BASE = 'https://api.telegram.org';

export function getBotToken(): string | undefined {
  const t = env.TELEGRAM_BOT_TOKEN?.trim();
  return t && t.length > 0 ? t : undefined;
}

export type StepResult = { ok: true } | { ok: false; error: string };

export async function callBotMethod(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<StepResult> {
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

export type WebhookInfo = {
  url?: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_message?: string;
};

export async function getWebhookInfo(token: string): Promise<WebhookInfo | null> {
  try {
    const res = await fetch(`${TG_API_BASE}/bot${token}/getWebhookInfo`);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: WebhookInfo;
    };
    return data.ok ? (data.result ?? null) : null;
  } catch {
    return null;
  }
}
