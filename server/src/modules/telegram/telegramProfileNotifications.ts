import { query } from '../../config/db.js';
import { sendTelegramMessage, type SendTelegramMessageResult } from './telegram.service.js';

export async function sendNotificationToProfile(
  profileId: string,
  text: string,
): Promise<SendTelegramMessageResult> {
  const r = await query<{ tid: string | null }>(
    `select telegram_user_id::text as tid from public.profiles where id = $1`,
    [profileId],
  );
  const row = r.rows[0];
  const tid = row?.tid?.trim();
  if (!tid) {
    return { status: 'skipped' };
  }

  return sendTelegramMessage({ telegramUserId: tid, text });
}
