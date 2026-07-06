import { TtlCache } from '../../lib/ttlCache.js';
import { query } from '../../config/db.js';
import { markReviewNotificationsReplied } from '../notifications/notifications.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { dbStatusToUi } from '../../lib/appointmentStatus.js';
import {
  buildClientAnalyticsKey,
  resolveClientAnalyticsDisplayName,
  resolveClientEmail,
  resolveClientPhone,
} from '../../lib/clientAnalyticsIdentity.js';
import { resolveClientDisplayIdentity } from '../../lib/clientDisplayIdentity.js';
import {
  addDays,
  isoDateLocal,
  overviewChartWindow,
  previousOverviewReportPeriod,
  OVERVIEW_MAX_RANGE_DAYS,
} from './masterOverview.dateUtils.js';
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

const overviewBundleCache = new TtlCache<Awaited<ReturnType<typeof buildMasterOverviewBundle>>>(45_000);

function mapDbAppointmentStatus(s: string): OverviewAppointmentRow['status'] {
  const ui = dbStatusToUi(s);
  if (ui === 'pending' || ui === 'confirmed' || ui === 'completed') return ui;
  if (
    ui === 'client_arrived' ||
    ui === 'in_progress' ||
    ui === 'master_marked_completed' ||
    ui === 'client_confirmed_completed'
  ) {
    return 'confirmed';
  }
  return 'cancelled';
}

function padTimeFromDate(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Окно загрузки записей: период + предыдущий период для трендов + ближайшие будущие визиты. */
function resolveOverviewSqlWindow(preset: OverviewPeriodPreset): { startIso: string; endIso: string } {
  const period = resolveOverviewPeriodRange(preset, []);
  const prev = previousOverviewReportPeriod(period.start, period.end);
  const chart = overviewChartWindow(period.start, period.end, OVERVIEW_MAX_RANGE_DAYS);
  let startIso = period.start;
  if (prev && prev.start < startIso) startIso = prev.start;
  if (chart.chartStart < startIso) startIso = chart.chartStart;
  return { startIso, endIso: period.end };
}

/** Записи мастера для аналитики — с фильтром по периоду, без полного скана таблицы. */
async function loadOverviewAppointments(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<OverviewAppointmentRow[]> {
  const { startIso, endIso } = resolveOverviewSqlWindow(preset);
  const r = await query<{
    id: string;
    client_id: string;
    starts_at: Date | string;
    status: string;
    price_snapshot: string;
    service_title_snapshot: string | null;
    client_name_snapshot: string | null;
    client_phone_snapshot: string | null;
    client_email_snapshot: string | null;
    client_telegram_username_snapshot: string | null;
    profile_full_name: string | null;
    profile_phone: string | null;
    profile_telegram: string | null;
  }>(
    `select a.id, a.client_id, a.starts_at, a.status::text, a.price_snapshot::text,
            a.service_title_snapshot,
            a.client_name_snapshot, a.client_phone_snapshot, a.client_email_snapshot,
            a.client_telegram_username_snapshot,
            nullif(trim(p.full_name), '') as profile_full_name,
            p.phone as profile_phone, p.telegram_username as profile_telegram
       from public.appointments a
       left join public.profiles p on p.id = a.client_id
      where a.master_id = $1
        and (
          (a.starts_at >= $2::timestamptz and a.starts_at < ($3::date + interval '1 day'))
          or a.starts_at >= now()
        )
      order by a.starts_at asc
      limit 5000`,
    [masterId, `${startIso}T00:00:00`, endIso],
  );

  return r.rows.map((row) => {
    const d = new Date(row.starts_at);
    const price = Number(row.price_snapshot);
    const identityInput = {
      appointmentId: row.id,
      clientId: row.client_id,
      profileFullName: row.profile_full_name,
      nameSnapshot: row.client_name_snapshot,
      phone: row.profile_phone,
      phoneSnapshot: row.client_phone_snapshot,
      emailSnapshot: row.client_email_snapshot,
    };
    const clientDisplayName = resolveClientAnalyticsDisplayName(identityInput);
    const clientPhone = resolveClientPhone(identityInput);
    const clientEmail = resolveClientEmail(identityInput);
    const clientKey = buildClientAnalyticsKey(identityInput);

    return {
      id: row.id,
      clientId: row.client_id,
      clientName: clientDisplayName,
      clientDisplayName,
      clientPhone,
      clientEmail,
      clientKey,
      serviceTitle: row.service_title_snapshot || 'Услуга',
      date: isoDateLocal(d),
      time: padTimeFromDate(d),
      priceByn: Number.isFinite(price) ? price : 0,
      status: mapDbAppointmentStatus(row.status),
      dbStatus: row.status,
    };
  });
}

async function loadMasterReviews(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<MasterOverviewReviewRow[]> {
  const { startIso } = resolveOverviewSqlWindow(preset);
  const reviewSince = isoDateLocal(addDays(new Date(`${startIso}T12:00:00`), -365));
  const r = await query<{
    id: string;
    rating: number;
    body: string;
    created_at: string;
    full_name: string | null;
    phone: string | null;
    telegram_username: string | null;
    avatar_url: string | null;
    master_display_name: string | null;
    master_photo_url: string | null;
    client_name_snapshot: string | null;
    client_phone_snapshot: string | null;
    master_reply: string | null;
    master_reply_at: string | null;
  }>(
    `select r.id, r.rating, r.body, r.created_at,
            p.full_name, p.phone, p.telegram_username, p.avatar_url,
            mp.display_name as master_display_name, mp.photo_url as master_photo_url,
            a.client_name_snapshot, a.client_phone_snapshot,
            r.master_reply, r.master_reply_at
       from public.reviews r
       join public.appointments a on a.id = r.appointment_id
       left join public.profiles p on p.id = r.client_id
       left join public.master_profiles mp on mp.master_id = r.client_id
      where r.master_id = $1 and r.status = 'published'
        and r.created_at >= $2::timestamptz
      order by r.created_at desc
      limit 500`,
    [masterId, `${reviewSince}T00:00:00`],
  );

  return r.rows.map((row) => {
    const identity = resolveClientDisplayIdentity({
      masterDisplayName: row.master_display_name,
      masterPhotoUrl: row.master_photo_url,
      profileFullName: row.full_name,
      profileAvatarUrl: row.avatar_url,
      nameSnapshot: row.client_name_snapshot,
      phone: row.phone,
      phoneSnapshot: row.client_phone_snapshot,
      telegramUsername: row.telegram_username,
    });
    const author = identity.displayName;
    const created = new Date(row.created_at);
    return {
      id: row.id,
      author,
      authorInitial: author.trim().charAt(0).toUpperCase() || 'К',
      authorAvatarUrl: identity.avatarUrl,
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

async function buildMasterOverviewBundle(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<MasterOverviewBundle> {
  const [appointments, reviews] = await Promise.all([
    loadOverviewAppointments(masterId, preset),
    loadMasterReviews(masterId, preset),
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

/** Одна загрузка записей и отзывов — без 4× повторных запросов к БД. */
export async function getMasterOverviewBundle(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<MasterOverviewBundle> {
  const cacheKey = `${masterId}:${preset}`;
  const cached = overviewBundleCache.get(cacheKey);
  if (cached) return cached;
  const bundle = await buildMasterOverviewBundle(masterId, preset);
  overviewBundleCache.set(cacheKey, bundle);
  return bundle;
}

export type MasterOverviewFreeBundle = Pick<
  MasterOverviewBundle,
  'clients' | 'reputation' | 'periodStart' | 'periodEnd'
>;

/** Free-тариф: клиенты + репутация одним round-trip (без двойной загрузки appointments). */
export async function getMasterOverviewFreeBundle(
  masterId: string,
  preset: OverviewPeriodPreset,
): Promise<MasterOverviewFreeBundle> {
  const cacheKey = `free:${masterId}:${preset}`;
  const cached = overviewBundleCache.get(cacheKey);
  if (cached) {
    return {
      clients: cached.clients,
      reputation: cached.reputation,
      periodStart: cached.periodStart,
      periodEnd: cached.periodEnd,
    };
  }
  const bundle = await buildMasterOverviewBundle(masterId, preset);
  overviewBundleCache.set(cacheKey, bundle);
  return {
    clients: bundle.clients,
    reputation: bundle.reputation,
    periodStart: bundle.periodStart,
    periodEnd: bundle.periodEnd,
  };
}

export async function getMasterOverviewSummary(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId, preset);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewSummary(appointments, start, end);
}

export async function getMasterOverviewRevenue(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId, preset);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewRevenue(appointments, start, end);
}

export async function getMasterOverviewClients(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId, preset);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  return computeOverviewClients(appointments, start, end);
}

export async function getMasterOverviewReputation(masterId: string, preset: OverviewPeriodPreset) {
  const appointments = await loadOverviewAppointments(masterId, preset);
  const { start, end } = resolveOverviewPeriodRange(preset, appointments);
  const reviews = await loadMasterReviews(masterId, preset);
  return computeOverviewReputation(reviews, start, end);
}

export type MasterReviewNotificationDetail = {
  reviewId: string;
  rating: number;
  body: string;
  createdAt: string;
  appointmentId: string;
  bookingCode: string | null;
  clientName: string;
  clientPhone: string | null;
  clientAvatarUrl: string | null;
  serviceName: string;
  visitAt: string;
};

type MasterReviewDetailRow = {
  id: string;
  rating: number;
  body: string;
  created_at: Date | string;
  appointment_id: string;
  voucher_number: string | null;
  client_name_snapshot: string | null;
  client_phone_snapshot: string | null;
  full_name: string;
  phone: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
  master_display_name: string | null;
  master_photo_url: string | null;
  service_title_snapshot: string;
  starts_at: Date | string;
};

const MASTER_REVIEW_DETAIL_SQL = `select r.id, r.rating, r.body, r.created_at, r.appointment_id,
            bv.voucher_number,
            a.client_name_snapshot, a.client_phone_snapshot,
            coalesce(p.full_name, '') as full_name, p.phone, p.telegram_username, p.avatar_url,
            mp.display_name as master_display_name, mp.photo_url as master_photo_url,
            a.service_title_snapshot, a.starts_at
       from public.reviews r
       join public.appointments a on a.id = r.appointment_id
       left join public.profiles p on p.id = r.client_id
       left join public.master_profiles mp on mp.master_id = r.client_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id`;

function mapMasterReviewDetailRow(row: MasterReviewDetailRow): MasterReviewNotificationDetail {
  const clientIdentity = resolveClientDisplayIdentity({
    masterDisplayName: row.master_display_name,
    masterPhotoUrl: row.master_photo_url,
    profileFullName: row.full_name,
    profileAvatarUrl: row.avatar_url,
    nameSnapshot: row.client_name_snapshot,
    phone: row.phone,
    phoneSnapshot: row.client_phone_snapshot,
    telegramUsername: row.telegram_username,
  });

  const visitDate = new Date(row.starts_at);
  const visitAt = Number.isNaN(visitDate.getTime())
    ? 'Дата не указана'
    : visitDate.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const created = new Date(row.created_at);

  return {
    reviewId: row.id,
    rating: row.rating,
    body: row.body.trim(),
    createdAt: Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString(),
    appointmentId: row.appointment_id,
    bookingCode: row.voucher_number?.trim() || null,
    clientName: clientIdentity.displayName,
    clientPhone: clientIdentity.phone,
    clientAvatarUrl: clientIdentity.avatarUrl,
    serviceName: row.service_title_snapshot?.trim() || 'Услуга',
    visitAt,
  };
}

export async function getMasterReviewNotificationDetail(
  masterId: string,
  reviewId: string,
): Promise<MasterReviewNotificationDetail> {
  const r = await query<MasterReviewDetailRow>(
    `${MASTER_REVIEW_DETAIL_SQL}
      where r.id = $1 and r.master_id = $2 and r.status = 'published'`,
    [reviewId, masterId],
  );

  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Отзыв не найден');
  }

  return mapMasterReviewDetailRow(row);
}

export async function getMasterReviewDetailByAppointmentId(
  masterId: string,
  appointmentId: string,
): Promise<MasterReviewNotificationDetail> {
  const r = await query<MasterReviewDetailRow>(
    `${MASTER_REVIEW_DETAIL_SQL}
      where r.appointment_id = $1 and r.master_id = $2 and r.status = 'published'`,
    [appointmentId, masterId],
  );

  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Отзыв не найден');
  }

  return mapMasterReviewDetailRow(row);
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

  await markReviewNotificationsReplied(masterId, reviewId);
  overviewBundleCache.delete(`${masterId}:month`);
  overviewBundleCache.delete(`${masterId}:week`);
  overviewBundleCache.delete(`${masterId}:today`);
  overviewBundleCache.delete(`${masterId}:all`);
  overviewBundleCache.delete(`free:${masterId}:month`);
  overviewBundleCache.delete(`free:${masterId}:week`);
  overviewBundleCache.delete(`free:${masterId}:today`);
  overviewBundleCache.delete(`free:${masterId}:all`);
}
