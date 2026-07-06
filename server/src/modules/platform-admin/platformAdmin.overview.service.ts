import { query } from '../../config/db.js';
import { TtlCache } from '../../lib/ttlCache.js';

export type PlatformAdminOverview = {
  usersTotal: number;
  clientsTotal: number;
  mastersTotal: number;
  activeMastersTotal: number;
  pendingCategoryRequests: number;
  pendingSponsorRequests: number;
  blockedUsers: number;
  bookingsToday: number;
  cancellationsLast7Days: number;
};

const overviewCache = new TtlCache<PlatformAdminOverview>(60_000);

async function loadPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  const r = await query<{
    users_total: string;
    clients_total: string;
    masters_total: string;
    active_masters_total: string;
    pending_category_requests: string;
    pending_sponsor_requests: string;
    blocked_users: string;
    bookings_today: string;
    cancellations_last_7_days: string;
  }>(
    `select
       (select count(*)::text from public.profiles) as users_total,
       (select count(*)::text from public.profiles where role = 'client') as clients_total,
       (select count(*)::text from public.profiles where role = 'master') as masters_total,
       (select count(*)::text from public.master_profiles mp
         where mp.publication_status = 'published') as active_masters_total,
       (select count(*)::text from public.category_change_requests where status = 'pending') as pending_category_requests,
       (select count(*)::text from public.sponsor_requests where status in ('pending', 'in_review')) as pending_sponsor_requests,
       (select count(*)::text from public.profiles where account_status = 'blocked') as blocked_users,
       (select count(*)::text from public.appointments
         where starts_at >= date_trunc('day', now() at time zone 'utc')
           and starts_at < date_trunc('day', now() at time zone 'utc') + interval '1 day') as bookings_today,
       (select count(*)::text from public.appointments
         where status in ('cancelled_by_client', 'cancelled_by_master')
           and updated_at >= now() - interval '7 days') as cancellations_last_7_days`,
  );
  const row = r.rows[0]!;
  return {
    usersTotal: Number(row.users_total),
    clientsTotal: Number(row.clients_total),
    mastersTotal: Number(row.masters_total),
    activeMastersTotal: Number(row.active_masters_total),
    pendingCategoryRequests: Number(row.pending_category_requests),
    pendingSponsorRequests: Number(row.pending_sponsor_requests),
    blockedUsers: Number(row.blocked_users),
    bookingsToday: Number(row.bookings_today),
    cancellationsLast7Days: Number(row.cancellations_last_7_days),
  };
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  const cached = overviewCache.get('global');
  if (cached) return cached;
  const data = await loadPlatformAdminOverview();
  overviewCache.set('global', data);
  return data;
}
