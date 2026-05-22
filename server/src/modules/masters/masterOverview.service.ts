import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { listMasterAppointments } from '../appointments/appointments.service.js';
import { isoDateLocal } from './masterOverview.dateUtils.js';
import {
  computeOverviewClients,
  computeOverviewReputation,
  computeOverviewRevenue,
  computeOverviewSummary,
  resolveOverviewPeriodRange,
  type OverviewAppointmentRow,
  type OverviewPeriodPreset,
  type MasterOverviewReviewRow,
} from './masterOverview.analytics.js';

function mapDbAppointmentStatus(s: string): OverviewAppointmentRow['status'] {
  if (s === 'pending' || s === 'confirmed') return s;
  if (s === 'completed' || s === 'no_show') return 'completed';
  return 'cancelled';
}

function padTimeFromDate(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

async function loadOverviewAppointments(masterId: string): Promise<OverviewAppointmentRow[]> {
  const rows = await listMasterAppointments(masterId);
  return rows.map((row) => {
    const d = new Date(row.starts_at);
    const price = Number(row.price_snapshot);
    return {
      id: row.id,
      clientName: row.client_name || 'Клиент',
      serviceTitle: row.service_title_snapshot || 'Услуга',
      date: isoDateLocal(d),
      time: padTimeFromDate(d),
      priceByn: Number.isFinite(price) ? price : 0,
      status: mapDbAppointmentStatus(row.status),
    };
  });
}

async function loadMasterReviews(masterId: string): Promise<MasterOverviewReviewRow[]> {
  const r = await query<{
    id: string;
    rating: number;
    body: string;
    created_at: string;
    author: string;
    master_reply: string | null;
    master_reply_at: string | null;
  }>(
    `select r.id, r.rating, r.body, r.created_at,
            coalesce(nullif(trim(p.full_name), ''), 'Клиент') as author,
            r.master_reply, r.master_reply_at
       from public.reviews r
       left join public.profiles p on p.id = r.client_id
      where r.master_id = $1 and r.status = 'published'
      order by r.created_at desc`,
    [masterId],
  );

  return r.rows.map((row) => {
    const author = row.author || 'Клиент';
    const created = new Date(row.created_at);
    return {
      id: row.id,
      author,
      authorInitial: author.trim().charAt(0).toUpperCase() || 'К',
      dateIso: isoDateLocal(created),
      rating: row.rating,
      text: row.body,
      masterReply: row.master_reply?.trim() || null,
      replyAtIso: row.master_reply_at ? isoDateLocal(new Date(row.master_reply_at)) : null,
    };
  });
}

export type MasterOverviewBundle = {
  summary: Awaited<ReturnType<typeof computeOverviewSummary>>;
  revenue: Awaited<ReturnType<typeof computeOverviewRevenue>>;
  clients: Awaited<ReturnType<typeof computeOverviewClients>>;
  reputation: Awaited<ReturnType<typeof computeOverviewReputation>>;
  periodStart: string;
  periodEnd: string;
};

/** Одна загрузка записей и отзывов — без 4× повторных запросов к БД. */
export async function getMasterOverviewBundle(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<MasterOverviewBundle> {
  const [appointments, reviews] = await Promise.all([
    loadOverviewAppointments(masterId),
    loadMasterReviews(masterId),
  ]);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return {
    summary: computeOverviewSummary(appointments, start, end),
    revenue: computeOverviewRevenue(appointments, start, end),
    clients: computeOverviewClients(appointments, start, end),
    reputation: computeOverviewReputation(reviews, start, end),
    periodStart: start,
    periodEnd: end,
  };
}

export async function getMasterOverviewSummary(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewSummary(appointments, start, end);
}

export async function getMasterOverviewRevenue(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewRevenue(appointments, start, end);
}

export async function getMasterOverviewClients(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewClients(appointments, start, end);
}

export async function getMasterOverviewReputation(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  const reviews = await loadMasterReviews(masterId);
  return computeOverviewReputation(reviews, start, end);
}

export async function postMasterReviewReply(masterId: string, reviewId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw ApiError.badRequest('Текст ответа не может быть пустым', 'EMPTY_REPLY');
  }
  if (trimmed.length > 4000) {
    throw ApiError.badRequest('Слишком длинный ответ', 'REPLY_TOO_LONG');
  }

  const r = await query<{ id: string }>(
    `update public.reviews
        set master_reply = $1, master_reply_at = now(), updated_at = now()
      where id = $2 and master_id = $3 and status = 'published'
        and (master_reply is null or trim(master_reply) = '')
      returning id`,
    [trimmed, reviewId, masterId],
  );

  if (!r.rowCount) {
    const exists = await query<{ master_reply: string | null }>(
      `select master_reply from public.reviews where id = $1 and master_id = $2`,
      [reviewId, masterId],
    );
    if (!exists.rows[0]) {
      throw ApiError.notFound('Отзыв не найден');
    }
    if (exists.rows[0].master_reply?.trim()) {
      throw ApiError.conflict('На этот отзыв уже можно ответить только один раз', 'ALREADY_REPLIED');
    }
    throw ApiError.conflict('Не удалось сохранить ответ', 'REPLY_FAILED');
  }
}
