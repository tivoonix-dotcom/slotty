import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { computePendingExpiresAt } from '../../lib/bookingConfirmationDeadlines.js';
import {
  BOOKINGS_FROM_WITH_VOUCHER,
  buildBookingSearchSql,
  parseBookingSearchQuery,
} from './platformAdminBookingsSearch.js';

export type PlatformBookingListItem = {
  id: string;
  bookingCode: string | null;
  clientId: string;
  clientName: string;
  clientAccountStatus: string;
  masterId: string;
  masterName: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  status: string;
  cancelledBy: 'client' | 'master' | null;
  priceSnapshot: number;
  createdAt: string;
  updatedAt: string;
  cancelReason: string | null;
  clientNote: string | null;
};

export type PlatformBookingDetail = PlatformBookingListItem & {
  clientEmail: string | null;
  clientPhone: string | null;
  clientTelegramUsername: string | null;
  pendingConfirmDeadline: string | null;
  hasReview: boolean;
  notificationJobs: {
    total: number;
    pending: number;
    failed: number;
  };
  clientStats: {
    totalBookings: number;
    cancellationsByClient: number;
    cancellationsByMaster: number;
    noShows: number;
    completed: number;
  };
  recentBookings: PlatformBookingListItem[];
};

export type PlatformClientBookingStats = {
  clientId: string;
  fullName: string;
  accountStatus: string;
  email: string | null;
  totalBookings: number;
  cancellationsByClient: number;
  cancellationsByMaster: number;
  noShows: number;
  completed: number;
  lastBookingAt: string | null;
  lastCancellationAt: string | null;
};

function mapCancelledBy(status: string): 'client' | 'master' | null {
  if (status === 'cancelled_by_client') return 'client';
  if (status === 'cancelled_by_master') return 'master';
  return null;
}

function periodSql(period: string | undefined, alias: string): string {
  if (period === 'today') {
    return `${alias}.starts_at >= date_trunc('day', now() at time zone 'utc')
       and ${alias}.starts_at < date_trunc('day', now() at time zone 'utc') + interval '1 day'`;
  }
  if (period === 'week') {
    return `${alias}.starts_at >= now() - interval '7 days'`;
  }
  if (period === 'month') {
    return `${alias}.created_at >= now() - interval '30 days'`;
  }
  return '';
}

function statusSql(status: string | undefined): string {
  const s = status ?? 'all';
  if (s === 'pending') return `a.status = 'pending'`;
  if (s === 'confirmed') return `a.status = 'confirmed'`;
  if (s === 'completed') return `a.status = 'completed'`;
  if (s === 'cancelled') {
    return `a.status in ('cancelled_by_client', 'cancelled_by_master')`;
  }
  if (s === 'cancelled_by_client') return `a.status = 'cancelled_by_client'`;
  if (s === 'cancelled_by_master') return `a.status = 'cancelled_by_master'`;
  if (s === 'no_show') return `a.status = 'no_show'`;
  return '';
}

type BookingRow = {
  id: string;
  booking_code: string | null;
  client_id: string;
  client_name: string;
  client_account_status: string;
  master_id: string;
  master_name: string;
  service_title_snapshot: string;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
  price_snapshot: string;
  created_at: Date | string;
  updated_at: Date | string;
  cancel_reason: string | null;
  client_note: string | null;
};

function mapBookingRow(row: BookingRow): PlatformBookingListItem {
  return {
    id: row.id,
    bookingCode: row.booking_code,
    clientId: row.client_id,
    clientName: row.client_name,
    clientAccountStatus: row.client_account_status,
    masterId: row.master_id,
    masterName: row.master_name,
    serviceTitle: row.service_title_snapshot,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    status: row.status,
    cancelledBy: mapCancelledBy(row.status),
    priceSnapshot: Number(row.price_snapshot),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    cancelReason: row.cancel_reason,
    clientNote: row.client_note,
  };
}

const BOOKING_SELECT = `
  select a.id, bv.voucher_number as booking_code, a.client_id, cp.full_name as client_name, cp.account_status::text as client_account_status,
         a.master_id, mp.display_name as master_name,
         a.service_title_snapshot, a.starts_at, a.ends_at, a.status::text as status,
         a.price_snapshot::text, a.created_at, a.updated_at, a.cancel_reason, a.client_note
    from public.appointments a
    left join public.booking_vouchers bv on bv.appointment_id = a.id
    join public.profiles cp on cp.id = a.client_id
    join public.master_profiles mp on mp.master_id = a.master_id
`;

export async function listPlatformBookings(params: {
  status?: string;
  period?: string;
  q?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  bookings: PlatformBookingListItem[];
  items: PlatformBookingListItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const statusCond = statusSql(params.status);
  if (statusCond) conditions.push(statusCond);

  const periodCond = periodSql(params.period, 'a');
  if (periodCond) conditions.push(periodCond);

  if (params.clientId) {
    conditions.push(`a.client_id = $${i++}`);
    vals.push(params.clientId);
  }

  const searchParsed = parseBookingSearchQuery(params.q);
  const searchBuilt = buildBookingSearchSql(searchParsed, vals, i);
  if (searchBuilt.condition) {
    conditions.push(searchBuilt.condition);
  }
  i = searchBuilt.nextIndex;

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;
  const fromClause = BOOKINGS_FROM_WITH_VOUCHER;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       ${fromClause}
       ${where}`,
    vals,
  );

  const listR = await query<BookingRow>(
    `${BOOKING_SELECT}
       ${where}
       order by ${searchBuilt.orderBy}
       limit $${i} offset $${i + 1}`,
    [...vals, limit, offset],
  );

  const items = listR.rows.map(mapBookingRow);
  return {
    bookings: items,
    items,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

async function getClientBookingStats(clientId: string): Promise<PlatformBookingDetail['clientStats']> {
  const r = await query<{
    total: string;
    cancelled_by_client: string;
    cancelled_by_master: string;
    no_shows: string;
    completed: string;
  }>(
    `select count(*)::text as total,
            count(*) filter (where status = 'cancelled_by_client')::text as cancelled_by_client,
            count(*) filter (where status = 'cancelled_by_master')::text as cancelled_by_master,
            count(*) filter (where status = 'no_show')::text as no_shows,
            count(*) filter (where status = 'completed')::text as completed
       from public.appointments
      where client_id = $1`,
    [clientId],
  );
  const row = r.rows[0];
  return {
    totalBookings: Number(row?.total ?? 0),
    cancellationsByClient: Number(row?.cancelled_by_client ?? 0),
    cancellationsByMaster: Number(row?.cancelled_by_master ?? 0),
    noShows: Number(row?.no_shows ?? 0),
    completed: Number(row?.completed ?? 0),
  };
}

export async function getPlatformBooking(bookingId: string): Promise<PlatformBookingDetail> {
  const r = await query<BookingRow>(`${BOOKING_SELECT} where a.id = $1`, [bookingId]);

  const baseRow = r.rows[0];
  if (!baseRow) throw ApiError.notFound('Booking not found');

  const emailR = await query<{ email: string | null }>(
    `select email from public.auth_identities ai
      where ai.profile_id = $1 and ai.provider = 'email'::public.auth_provider
      limit 1`,
    [baseRow.client_id],
  );

  const profileR = await query<{ phone: string | null; telegram_username: string | null }>(
    `select phone, telegram_username from public.profiles where id = $1`,
    [baseRow.client_id],
  );

  const recentR = await query<BookingRow>(
    `${BOOKING_SELECT}
      where a.client_id = $1 and a.id <> $2
      order by a.created_at desc
      limit 15`,
    [baseRow.client_id, bookingId],
  );

  const base = mapBookingRow(baseRow);
  const prof = profileR.rows[0];

  const reviewR = await query<{ has_review: boolean }>(
    `select exists (select 1 from public.reviews rv where rv.appointment_id = $1) as has_review`,
    [bookingId],
  );

  const jobsR = await query<{ total: string; pending: string; failed: string }>(
    `select count(*)::text as total,
            count(*) filter (where status = 'pending')::text as pending,
            count(*) filter (where status = 'failed')::text as failed
       from public.notification_jobs
      where appointment_id = $1`,
    [bookingId],
  );
  const jobsRow = jobsR.rows[0];

  return {
    ...base,
    clientEmail: emailR.rows[0]?.email ?? null,
    clientPhone: prof?.phone ?? null,
    clientTelegramUsername: prof?.telegram_username ?? null,
    pendingConfirmDeadline:
      base.status === 'pending'
        ? computePendingExpiresAt(base.createdAt, base.startsAt).toISOString()
        : null,
    hasReview: Boolean(reviewR.rows[0]?.has_review),
    notificationJobs: {
      total: Number(jobsRow?.total ?? 0),
      pending: Number(jobsRow?.pending ?? 0),
      failed: Number(jobsRow?.failed ?? 0),
    },
    clientStats: await getClientBookingStats(baseRow.client_id),
    recentBookings: recentR.rows.map(mapBookingRow),
  };
}

export async function listClientBookingStats(params: {
  period?: string;
  minCancellations?: number;
  limit?: number;
}): Promise<{ clients: PlatformClientBookingStats[] }> {
  const minCancel = Math.max(params.minCancellations ?? 2, 1);
  const limit = Math.min(params.limit ?? 30, 50);

  const periodFilter =
    params.period === 'month'
      ? `and a.created_at >= now() - interval '30 days'`
      : params.period === 'week'
        ? `and a.created_at >= now() - interval '7 days'`
        : '';

  const r = await query<{
    client_id: string;
    full_name: string;
    account_status: string;
    email: string | null;
    total: string;
    cancelled_by_client: string;
    cancelled_by_master: string;
    no_shows: string;
    completed: string;
    last_booking_at: Date | string | null;
    last_cancel_at: Date | string | null;
  }>(
    `select cp.id as client_id,
            cp.full_name,
            cp.account_status::text as account_status,
            (select email from public.auth_identities ai
              where ai.profile_id = cp.id and ai.provider = 'email'::public.auth_provider
              limit 1) as email,
            count(a.*)::text as total,
            count(*) filter (where a.status = 'cancelled_by_client')::text as cancelled_by_client,
            count(*) filter (where a.status = 'cancelled_by_master')::text as cancelled_by_master,
            count(*) filter (where a.status = 'no_show')::text as no_shows,
            count(*) filter (where a.status = 'completed')::text as completed,
            max(a.created_at) as last_booking_at,
            max(a.updated_at) filter (
              where a.status in ('cancelled_by_client', 'cancelled_by_master')
            ) as last_cancel_at
       from public.profiles cp
       join public.appointments a on a.client_id = cp.id
      where cp.role = 'client' ${periodFilter}
      group by cp.id, cp.full_name, cp.account_status
     having count(*) filter (where a.status = 'cancelled_by_client') >= $1
      order by count(*) filter (where a.status = 'cancelled_by_client') desc,
               count(a.*) desc
      limit $2`,
    [minCancel, limit],
  );

  return {
    clients: r.rows.map((row) => ({
      clientId: row.client_id,
      fullName: row.full_name,
      accountStatus: row.account_status,
      email: row.email,
      totalBookings: Number(row.total),
      cancellationsByClient: Number(row.cancelled_by_client),
      cancellationsByMaster: Number(row.cancelled_by_master),
      noShows: Number(row.no_shows),
      completed: Number(row.completed),
      lastBookingAt: row.last_booking_at ? new Date(row.last_booking_at).toISOString() : null,
      lastCancellationAt: row.last_cancel_at ? new Date(row.last_cancel_at).toISOString() : null,
    })),
  };
}
