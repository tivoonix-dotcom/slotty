import { query, withTransaction } from '../../config/db.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';

export type ReminderKind = '24h' | '1h';

type DueAppointmentRow = {
  id: string;
  client_id: string;
  master_id: string;
  starts_at: Date | string;
  service_title_snapshot: string;
  client_name: string;
  master_name: string;
  voucher_number: string | null;
};

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
  const svc = escapeTelegramHtml(row.service_title_snapshot || 'Услуга');
  const masterName = escapeTelegramHtml(row.master_name || 'Мастер');
  const clientName = escapeTelegramHtml(row.client_name || 'Клиент');
  const voucher = row.voucher_number ? escapeTelegramHtml(row.voucher_number) : null;
  const lead = REMINDER_WINDOWS[kind].leadPhrase;

  const clientBody = `${lead}: ${row.service_title_snapshot || 'Услуга'} — ${date}, ${time}. Мастер: ${row.master_name || 'Мастер'}.`;
  const masterBody = `${lead}: ${row.service_title_snapshot || 'Услуга'} — ${date}, ${time}. Клиент: ${row.client_name || 'Клиент'}.`;

  const clientText =
    `<b>${escapeTelegramHtml(REMINDER_WINDOWS[kind].clientTitle)}</b>\n` +
    `Услуга: ${svc}\n` +
    `Дата: ${escapeTelegramHtml(date)}\n` +
    `Время: ${escapeTelegramHtml(time)}\n` +
    `Мастер: ${masterName}` +
    (voucher ? `\nНомер записи: <code>${voucher}</code>` : '');

  const masterText =
    `<b>${escapeTelegramHtml(REMINDER_WINDOWS[kind].masterTitle)}</b>\n` +
    `Клиент: ${clientName}\n` +
    `Услуга: ${svc}\n` +
    `Дата: ${escapeTelegramHtml(date)}\n` +
    `Время: ${escapeTelegramHtml(time)}` +
    (voucher ? `\nНомер записи: <code>${voucher}</code>` : '');

  return { clientText, masterText, clientBody, masterBody };
}

async function fetchDueAppointments(kind: ReminderKind): Promise<DueAppointmentRow[]> {
  const win = REMINDER_WINDOWS[kind];
  const r = await query<DueAppointmentRow>(
    `select a.id, a.client_id, a.master_id, a.starts_at, a.service_title_snapshot,
            coalesce(nullif(trim(pc.full_name), ''), 'Клиент') as client_name,
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
           where d.appointment_id = a.id and d.reminder_kind = $3
        )
      order by a.starts_at asc
      limit 100`,
    [win.upper, win.lower, kind],
  );
  return r.rows;
}

async function deliverReminderForRow(row: DueAppointmentRow, kind: ReminderKind): Promise<void> {
  const meta = REMINDER_WINDOWS[kind];
  const { clientText, masterText, clientBody, masterBody } = buildTelegramTexts(row, kind);

  await withTransaction(async (client) => {
    const lock = await client.query(
      `select 1 from public.appointment_reminder_deliveries
        where appointment_id = $1 and reminder_kind = $2`,
      [row.id, kind],
    );
    if (lock.rowCount) return;

    const stillActive = await client.query(
      `select 1 from public.appointments
        where id = $1 and status in ('pending', 'confirmed') and starts_at > now()`,
      [row.id],
    );
    if (!stillActive.rowCount) return;

    await client.query(
      `insert into public.appointment_reminder_deliveries (appointment_id, reminder_kind)
       values ($1, $2)`,
      [row.id, kind],
    );

  });

  const related = { relatedEntityType: 'appointment' as const, relatedEntityId: row.id };

  await Promise.all([
    notifyUser({
      userId: row.client_id,
      type: 'appointment_reminder',
      title: meta.clientTitle,
      body: clientBody,
      ...related,
      telegramHtml: clientText,
    }),
    notifyUser({
      userId: row.master_id,
      type: 'appointment_reminder',
      title: meta.masterTitle,
      body: masterBody,
      ...related,
      telegramHtml: masterText,
    }),
  ]);
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
