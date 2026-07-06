import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { formatClientName, formatServiceName } from '../../lib/displayFormat.js';
import { notifyUser } from '../notifications/notifyUser.js';
import {
  clientBookingTelegramKeyboard,
  masterBookingTelegramKeyboard,
} from '../notifications/telegramAppointmentKeyboard.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

export type ReminderKind = '24h' | '1h';

type DueAppointmentRow = {
  id: string;
  client_id: string;
  master_id: string;
  starts_at: Date | string;
  service_title_snapshot: string;
  client_full_name: string;
  client_phone: string | null;
  client_telegram_username: string | null;
  master_name: string;
  voucher_number: string | null;
};

type ReminderDeliveryStatus = 'pending' | 'sent' | 'failed';

const MAX_REMINDER_RETRIES = 5;
const REMINDER_RETRY_COOLDOWN_MINUTES = 10;
const STALE_PENDING_MINUTES = 15;

/** Окно для cron ~5 мин: не пропустить момент «за 24ч» / «за 1ч». */
const REMINDER_WINDOWS: Record<
  ReminderKind,
  { upper: string; lower: string; clientTitle: string; masterTitle: string; leadPhrase: string }
> = {
  '24h': {
    upper: '24 hours 35 minutes',
    lower: '23 hours 25 minutes',
    clientTitle: 'Напоминание: завтра запись',
    masterTitle: 'Напоминание: завтра у вас запись',
    leadPhrase: 'Завтра',
  },
  '1h': {
    upper: '65 minutes',
    lower: '55 minutes',
    clientTitle: 'Напоминание: через час запись',
    masterTitle: 'Напоминание: через час у вас запись',
    leadPhrase: 'Через час',
  },
};

function buildTelegramTexts(row: DueAppointmentRow, kind: ReminderKind): {
  clientText: string;
  masterText: string;
  clientBody: string;
  masterBody: string;
} {
  const { date, time } = formatAppointmentDateTime(row.starts_at);
  const serviceTitle = formatServiceName(row.service_title_snapshot);
  const clientLabel = formatClientName({
    full_name: row.client_full_name,
    phone: row.client_phone,
    telegram_username: row.client_telegram_username,
  });
  const svc = escapeTelegramHtml(serviceTitle);
  const masterName = escapeTelegramHtml(row.master_name || 'Мастер');
  const clientName = escapeTelegramHtml(clientLabel);
  const voucher = row.voucher_number ? escapeTelegramHtml(row.voucher_number) : null;
  const lead = REMINDER_WINDOWS[kind].leadPhrase;

  const clientBody = `${lead}: ${serviceTitle} — ${date}, ${time}. Мастер: ${row.master_name || 'Мастер'}.`;
  const masterBody = `${lead}: ${serviceTitle} — ${date}, ${time}. Клиент: ${clientLabel}.`;

  const clientText =
    `<b>${escapeTelegramHtml(REMINDER_WINDOWS[kind].clientTitle)}</b>\n` +
    `Услуга: ${svc}\n` +
    `Дата: ${escapeTelegramHtml(date)}\n` +
    `Время: ${escapeTelegramHtml(time)}\n` +
    `Мастер: ${masterName}` +
    (voucher ? `\n\n<i>№ ${voucher}</i>` : '');

  const masterText =
    `<b>${escapeTelegramHtml(REMINDER_WINDOWS[kind].masterTitle)}</b>\n` +
    `Клиент: ${clientName}\n` +
    `Услуга: ${svc}\n` +
    `Дата: ${escapeTelegramHtml(date)}\n` +
    `Время: ${escapeTelegramHtml(time)}` +
    (voucher ? `\n\n<i>№ ${voucher}</i>` : '');

  return { clientText, masterText, clientBody, masterBody };
}

async function fetchDueAppointments(kind: ReminderKind): Promise<DueAppointmentRow[]> {
  const win = REMINDER_WINDOWS[kind];
  const r = await query<DueAppointmentRow>(
    `select a.id, a.client_id, a.master_id, a.starts_at, a.service_title_snapshot,
            coalesce(pc.full_name, '') as client_full_name,
            pc.phone as client_phone,
            pc.telegram_username as client_telegram_username,
            coalesce(nullif(trim(mp.display_name), ''), 'Мастер') as master_name,
            bv.voucher_number
       from public.appointments a
       join public.profiles pc on pc.id = a.client_id
       join public.master_profiles mp on mp.master_id = a.master_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id
      where a.status in ('pending', 'confirmed')
        and a.starts_at > now()
        and a.starts_at <= now() + $1::interval
        and a.starts_at > now() + $2::interval
        and not exists (
          select 1 from public.appointment_reminder_deliveries d
           where d.appointment_id = a.id
             and d.reminder_kind = $3
             and d.status = 'sent'
        )
        and (
          not exists (
            select 1 from public.appointment_reminder_deliveries d2
             where d2.appointment_id = a.id and d2.reminder_kind = $3
          )
          or exists (
            select 1 from public.appointment_reminder_deliveries d3
             where d3.appointment_id = a.id
               and d3.reminder_kind = $3
               and d3.status = 'failed'
               and d3.retry_count < $4
               and d3.failed_at < now() - ($5::int || ' minutes')::interval
          )
          or exists (
            select 1 from public.appointment_reminder_deliveries d4
             where d4.appointment_id = a.id
               and d4.reminder_kind = $3
               and d4.status = 'pending'
               and d4.created_at < now() - ($6::int || ' minutes')::interval
          )
        )
      order by a.starts_at asc
      limit 100`,
    [
      win.upper,
      win.lower,
      kind,
      MAX_REMINDER_RETRIES,
      REMINDER_RETRY_COOLDOWN_MINUTES,
      STALE_PENDING_MINUTES,
    ],
  );
  return r.rows;
}

async function claimReminderDelivery(
  client: PoolClient,
  appointmentId: string,
  kind: ReminderKind,
): Promise<boolean> {
  const stillActive = await client.query(
    `select 1 from public.appointments
      where id = $1 and status in ('pending', 'confirmed') and starts_at > now()`,
    [appointmentId],
  );
  if (!stillActive.rowCount) return false;

  const existing = await client.query<{
    status: ReminderDeliveryStatus;
    retry_count: number;
    created_at: Date | string;
  }>(
    `select status, retry_count, created_at
       from public.appointment_reminder_deliveries
      where appointment_id = $1 and reminder_kind = $2
      for update`,
    [appointmentId, kind],
  );

  const row = existing.rows[0];
  if (row?.status === 'sent') return false;

  if (row?.status === 'pending') {
    const created = new Date(row.created_at as Date).getTime();
    const staleMs = STALE_PENDING_MINUTES * 60 * 1000;
    if (Date.now() - created < staleMs) return false;
  }

  if (row?.status === 'failed') {
    if (row.retry_count >= MAX_REMINDER_RETRIES) return false;
  }

  if (!row) {
    await client.query(
      `insert into public.appointment_reminder_deliveries (
         appointment_id, reminder_kind, status, created_at
       ) values ($1, $2, 'pending', now())`,
      [appointmentId, kind],
    );
    return true;
  }

  await client.query(
    `update public.appointment_reminder_deliveries
        set status = 'pending',
            sent_at = null,
            failed_at = null,
            error_message = null,
            created_at = now()
      where appointment_id = $1 and reminder_kind = $2`,
    [appointmentId, kind],
  );
  return true;
}

async function markReminderSent(appointmentId: string, kind: ReminderKind): Promise<void> {
  await query(
    `update public.appointment_reminder_deliveries
        set status = 'sent',
            sent_at = now(),
            failed_at = null,
            error_message = null
      where appointment_id = $1 and reminder_kind = $2`,
    [appointmentId, kind],
  );
}

async function markReminderFailed(
  appointmentId: string,
  kind: ReminderKind,
  errorMessage: string,
): Promise<void> {
  await query(
    `update public.appointment_reminder_deliveries
        set status = 'failed',
            failed_at = now(),
            error_message = $3,
            retry_count = retry_count + 1
      where appointment_id = $1 and reminder_kind = $2`,
    [appointmentId, kind, errorMessage.slice(0, 2000)],
  );
}

function reminderNotifyContext(row: DueAppointmentRow): AppointmentNotifyContext {
  const startsAt =
    row.starts_at instanceof Date ? row.starts_at.toISOString() : String(row.starts_at);
  return {
    appointmentId: row.id,
    clientId: row.client_id,
    masterId: row.master_id,
    serviceTitle: formatServiceName(row.service_title_snapshot),
    startsAt,
    voucherNumber: row.voucher_number,
    clientName: formatClientName({
      full_name: row.client_full_name,
      phone: row.client_phone,
      telegram_username: row.client_telegram_username,
    }),
    clientPhone: row.client_phone?.trim() || null,
    masterName: row.master_name || 'Мастер',
  };
}

async function deliverReminderForRow(row: DueAppointmentRow, kind: ReminderKind): Promise<void> {
  const meta = REMINDER_WINDOWS[kind];
  const { clientText, masterText, clientBody, masterBody } = buildTelegramTexts(row, kind);
  const ctx = reminderNotifyContext(row);

  const claimed = await withTransaction(async (client) =>
    claimReminderDelivery(client, row.id, kind),
  );
  if (!claimed) return;

  const related = { relatedEntityType: 'appointment' as const, relatedEntityId: row.id };

  try {
    await notifyUser({
      userId: row.client_id,
      type: 'appointment_reminder',
      audience: 'client',
      title: meta.clientTitle,
      body: clientBody,
      ...related,
      telegramHtml: clientText,
      telegramReplyMarkup: clientBookingTelegramKeyboard(ctx, { allowCancel: true }) as unknown as Record<
        string,
        unknown
      >,
    });
    await notifyUser({
      userId: row.master_id,
      type: 'appointment_reminder',
      audience: 'master',
      title: meta.masterTitle,
      body: masterBody,
      ...related,
      telegramHtml: masterText,
      telegramReplyMarkup: masterBookingTelegramKeyboard(ctx) as unknown as Record<string, unknown>,
      masterPreferenceEvent: 'reminder_1h',
    });
    await markReminderSent(row.id, kind);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await markReminderFailed(row.id, kind, message);
    throw e;
  }
}

async function processReminderKind(kind: ReminderKind): Promise<number> {
  const due = await fetchDueAppointments(kind);
  for (const row of due) {
    try {
      await deliverReminderForRow(row, kind);
    } catch (e) {
      console.warn(`[reminders] failed ${kind} appointment=${row.id}:`, e instanceof Error ? e.message : e);
    }
  }
  return due.length;
}

export type ReminderRunReport = {
  sent24h: number;
  sent1h: number;
  durationMs: number;
};

/** Обработать напоминания за 24 часа и за 1 час до визита. */
export async function processAppointmentReminders(): Promise<ReminderRunReport> {
  const started = Date.now();
  const sent24h = await processReminderKind('24h');
  const sent1h = await processReminderKind('1h');
  return {
    sent24h,
    sent1h,
    durationMs: Date.now() - started,
  };
}
