import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type {
  CategoryChangeRequestAdmin,
  SponsorRequestAdmin,
  PlatformAdminOverview,
  PlatformAuditLogItem,
  PlatformBookingDetail,
  PlatformBookingListItem,
  PlatformClientBookingStats,
  PlatformMasterDetail,
  PlatformMasterListItem,
  PlatformMasterPickerItem,
  PlatformServiceListItem,
  PlatformUserDetail,
  PlatformUserListItem,
  PromoCodeAdmin,
  PlatformPurchaseRow,
  PlatformPurchasesSummary,
  ProManualPaymentRequestAdmin,
  ProfileReportAdmin,
  ClientReportAdmin,
  AccountDeletionRequestAdmin,
  SupportTicketAdmin,
  SupportTicketAdminDetail,
  EmailCampaignAdmin,
  EmailCampaignAudience,
  EmailCampaignRecipientAdmin,
  NewsletterSubscriberAdmin,
  NotificationDeliveryAdmin,
  AppointmentReminderFailureAdmin,
} from './platformAdmin.types';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  const res = await apiFetch('/api/platform-admin/overview');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformAdminOverview;
}

export type PlatformPagedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 50;

export async function getCategoryChangeRequests(
  status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<CategoryChangeRequestAdmin> & { requests: CategoryChangeRequestAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/category-change-requests?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    requests: CategoryChangeRequestAdmin[];
    items?: CategoryChangeRequestAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.requests;
  return { requests: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function approveCategoryChangeRequest(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/category-change-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function rejectCategoryChangeRequest(id: string, adminComment: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/category-change-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminComment }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getSponsorRequests(
  status: 'all' | 'pending' | 'in_review' | 'closed' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<SponsorRequestAdmin> & { requests: SponsorRequestAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/sponsor-requests?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    requests: SponsorRequestAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return { requests: data.requests, items: data.requests, total: data.total, limit: data.limit, offset: data.offset };
}

export async function updateSponsorRequestStatus(
  id: string,
  status: 'in_review' | 'closed' | 'rejected',
  adminComment?: string,
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/sponsor-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminComment: adminComment ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getProfileReports(
  status: 'all' | 'pending' | 'in_review' | 'closed' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<ProfileReportAdmin> & { reports: ProfileReportAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/profile-reports?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    reports: ProfileReportAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return { reports: data.reports, items: data.reports, total: data.total, limit: data.limit, offset: data.offset };
}

export async function updateProfileReportStatus(
  id: string,
  status: 'in_review' | 'closed' | 'rejected',
  adminComment?: string,
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/profile-reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminComment: adminComment ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getClientReports(
  status: 'all' | 'pending' | 'in_review' | 'closed' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<ClientReportAdmin> & { reports: ClientReportAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/client-reports?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    reports: ClientReportAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return { reports: data.reports, items: data.reports, total: data.total, limit: data.limit, offset: data.offset };
}

export async function updateClientReportStatus(
  id: string,
  status: 'in_review' | 'closed' | 'rejected',
  adminComment?: string,
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/client-reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminComment: adminComment ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformUsers(params?: {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformUserListItem> & { users: PlatformUserListItem[] }> {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.role) q.set('role', params.role);
  if (params?.status) q.set('status', params.status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const qs = q.toString();
  const res = await apiFetch(`/api/platform-admin/users?${qs}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    users: PlatformUserListItem[];
    items?: PlatformUserListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.users;
  return { users: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformUser(id: string): Promise<PlatformUserDetail> {
  const res = await apiFetch(`/api/platform-admin/users/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { user: PlatformUserDetail };
  return data.user;
}

export async function blockUser(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/block`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unblockUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/unblock`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function restrictUser(id: string, reason: string, until?: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/restrict`, {
    method: 'POST',
    body: JSON.stringify({ reason, until: until ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unrestrictUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/unrestrict`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformMasters(params?: {
  filter?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformMasterListItem> & { masters: PlatformMasterListItem[] }> {
  const q = new URLSearchParams();
  if (params?.filter) q.set('filter', params.filter);
  if (params?.q) q.set('q', params.q);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/masters?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    masters: PlatformMasterListItem[];
    items?: PlatformMasterListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.masters;
  return { masters: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformMasterPicker(q?: string): Promise<PlatformMasterPickerItem[]> {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const res = await apiFetch(`/api/platform-admin/masters-picker${qs}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { masters: PlatformMasterPickerItem[] };
  return data.masters;
}

export async function getPlatformMaster(id: string): Promise<PlatformMasterDetail> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { master: PlatformMasterDetail };
  return data.master;
}

export async function hideMaster(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unhideMaster(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/unhide`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function pauseMaster(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unpauseMaster(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/unpause`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function grantMasterComplimentaryPro(
  masterId: string,
  params: { days: number; reason: string },
): Promise<{ validUntil: string; planCode: 'pro' }> {
  const res = await apiFetch(`/api/platform-admin/masters/${masterId}/grant-pro`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { validUntil: string; planCode: 'pro' };
}

export async function getPlatformServices(params?: {
  filter?: string;
  q?: string;
  masterId?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformServiceListItem> & { services: PlatformServiceListItem[] }> {
  const q = new URLSearchParams();
  if (params?.filter) q.set('filter', params.filter);
  if (params?.q) q.set('q', params.q);
  if (params?.masterId) q.set('masterId', params.masterId);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/services?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    services: PlatformServiceListItem[];
    items?: PlatformServiceListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.services;
  return { services: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function hideService(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/services/${id}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unhideService(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/services/${id}/unhide`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformBookings(params?: {
  status?: string;
  period?: string;
  q?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformBookingListItem> & { bookings: PlatformBookingListItem[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.period) q.set('period', params.period);
  if (params?.q) q.set('q', params.q);
  if (params?.clientId) q.set('clientId', params.clientId);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/bookings?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    bookings: PlatformBookingListItem[];
    items?: PlatformBookingListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.bookings;
  return { bookings: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformBooking(id: string): Promise<PlatformBookingDetail> {
  const res = await apiFetch(`/api/platform-admin/bookings/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { booking: PlatformBookingDetail };
  return data.booking;
}

export type PlatformBookingEventRow = {
  id: string;
  eventType: string;
  label: string;
  createdAt: string;
  comment: string | null;
};

export type PlatformBookingDisputeRow = {
  id: string;
  reason: string;
  comment: string | null;
  status: string;
  createdByRole: string;
  resolution: string | null;
  adminNote: string | null;
  createdAt: string;
};

export type PlatformBookingNotificationJob = {
  id: string;
  jobType: string;
  channel: string;
  status: string;
  scheduledAt: string;
  attempts: number;
  lastError: string | null;
  providerMessageId: string | null;
};

export type PlatformBookingAuditSummary = {
  status: string;
  cancelReason: string | null;
  noShowAt: string | null;
  autoCompletedAt: string | null;
  clientSignal: {
    kind: 'on_the_way' | 'running_late' | 'reported_arrived' | null;
    lateMinutes: number | null;
    comment: string | null;
  } | null;
};

function voucherPath(code: string, suffix: string): string {
  const v = encodeURIComponent(code.trim().toUpperCase());
  return `/api/platform-admin/bookings/voucher/${v}${suffix}`;
}

export async function getPlatformBookingEvents(bookingCode: string): Promise<{
  events: PlatformBookingEventRow[];
}> {
  const res = await apiFetch(voucherPath(bookingCode, '/events'));
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    events: Array<{
      id: string;
      eventType: string;
      label: string;
      createdAt: string;
      comment: string | null;
    }>;
  };
  return { events: data.events };
}

export async function getPlatformBookingDisputes(bookingCode: string): Promise<{
  disputes: PlatformBookingDisputeRow[];
  openDispute: { id: string } | null;
}> {
  const res = await apiFetch(voucherPath(bookingCode, '/disputes'));
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    disputes: PlatformBookingDisputeRow[];
    openDispute: { id: string; status?: string } | null;
  };
  return {
    disputes: data.disputes,
    openDispute: data.openDispute?.id ? { id: data.openDispute.id } : null,
  };
}

export async function getPlatformBookingNotifications(bookingCode: string): Promise<{
  jobs: PlatformBookingNotificationJob[];
}> {
  const res = await apiFetch(voucherPath(bookingCode, '/notifications'));
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    jobs: Array<{
      id: string;
      job_type: string;
      channel: string;
      status: string;
      scheduled_at: string;
      attempts: number;
      last_error: string | null;
      provider_message_id: string | null;
    }>;
  };
  return {
    jobs: data.jobs.map((j) => ({
      id: j.id,
      jobType: j.job_type,
      channel: j.channel,
      status: j.status,
      scheduledAt: j.scheduled_at,
      attempts: j.attempts,
      lastError: j.last_error,
      providerMessageId: j.provider_message_id,
    })),
  };
}

export async function getPlatformBookingAudit(bookingCode: string): Promise<PlatformBookingAuditSummary> {
  const res = await apiFetch(voucherPath(bookingCode, '/audit'));
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as PlatformBookingAuditSummary;
  return data;
}

export async function resolvePlatformBookingDispute(
  bookingCode: string,
  disputeId: string,
  body: {
    resolution: 'client_supported' | 'master_supported' | 'neutral' | 'rejected';
    adminNote: string;
    finalStatus?: 'completed' | 'no_show' | 'cancelled_by_master' | null;
  },
): Promise<void> {
  const res = await apiFetch(voucherPath(bookingCode, `/disputes/${disputeId}/resolve`), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export function getPlatformAdminBookingDeepLink(bookingId: string): string {
  const params = new URLSearchParams({ open: bookingId });
  return `/platform-admin/bookings?${params.toString()}`;
}

export async function getClientBookingStats(params?: {
  period?: 'all' | 'week' | 'month';
  minCancellations?: number;
}): Promise<PlatformClientBookingStats[]> {
  const q = new URLSearchParams();
  if (params?.period) q.set('period', params.period);
  if (params?.minCancellations != null) q.set('minCancellations', String(params.minCancellations));
  const qs = q.toString();
  const res = await apiFetch(`/api/platform-admin/bookings-clients/stats${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { clients: PlatformClientBookingStats[] };
  return data.clients;
}

export async function getPromoCodes(): Promise<PromoCodeAdmin[]> {
  const res = await apiFetch('/api/platform-admin/promo-codes');
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { promoCodes: PromoCodeAdmin[] };
  return data.promoCodes;
}

export async function createPromoCode(body: {
  code: string;
  title?: string | null;
  discountPercent: number;
  billingPeriod?: 'month' | 'year' | null;
  maxRedemptions?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}): Promise<PromoCodeAdmin> {
  const res = await apiFetch('/api/platform-admin/promo-codes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { promoCode: PromoCodeAdmin };
  return data.promoCode;
}

export async function setPromoCodeActive(id: string, isActive: boolean): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/promo-codes/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformPurchasesSummary(): Promise<PlatformPurchasesSummary> {
  const res = await apiFetch('/api/platform-admin/purchases/summary');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPurchasesSummary;
}

export async function getPlatformPurchases(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ purchases: PlatformPurchaseRow[]; total: number }> {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/purchases?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { purchases: PlatformPurchaseRow[]; total: number };
}

export async function getProPaymentRequests(
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<ProManualPaymentRequestAdmin> & { requests: ProManualPaymentRequestAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/billing/manual-payment-requests?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    requests: ProManualPaymentRequestAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return {
    requests: data.requests,
    items: data.requests,
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
}

export async function approveProPaymentRequest(
  id: string,
  body: {
    receivedAmount?: number | null;
    adminNote?: string | null;
    taxReceiptCreated?: boolean;
    taxReceiptNote?: string | null;
  },
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/billing/manual-payment-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function rejectProPaymentRequest(
  id: string,
  body: { rejectionReason: string; adminNote?: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/billing/manual-payment-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getAuditLogs(params?: {
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformAuditLogItem> & { logs: PlatformAuditLogItem[] }> {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/audit-logs?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    logs: PlatformAuditLogItem[];
    items?: PlatformAuditLogItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.logs;
  return { logs: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getEmailSendingStatus(): Promise<{ configured: boolean; from: string | null }> {
  const res = await apiFetch('/api/platform-admin/email/status');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { configured: boolean; from: string | null };
}

export async function getEmailCampaigns(params?: {
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<EmailCampaignAdmin>> {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/email/campaigns?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPagedResult<EmailCampaignAdmin>;
}

export async function createEmailCampaign(body: {
  title: string;
  subject: string;
  previewText?: string | null;
  bodyText: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  audience: EmailCampaignAudience;
}): Promise<EmailCampaignAdmin> {
  const res = await apiFetch('/api/platform-admin/email/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as EmailCampaignAdmin;
}

export async function updateEmailCampaign(
  id: string,
  body: Partial<{
    title: string;
    subject: string;
    previewText: string | null;
    bodyText: string;
    ctaText: string | null;
    ctaUrl: string | null;
    audience: EmailCampaignAudience;
  }>,
): Promise<EmailCampaignAdmin> {
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as EmailCampaignAdmin;
}

export async function previewEmailCampaign(id: string): Promise<{
  campaign: EmailCampaignAdmin;
  recipientCount: number;
  previewHtml: string;
}> {
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}/preview`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as {
    campaign: EmailCampaignAdmin;
    recipientCount: number;
    previewHtml: string;
  };
}

export async function getEmailCampaignAudienceCount(
  id: string,
  testEmail?: string,
): Promise<{ count: number; audience: EmailCampaignAudience }> {
  const q = testEmail ? `?testEmail=${encodeURIComponent(testEmail)}` : '';
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}/audience-count${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { count: number; audience: EmailCampaignAudience };
}

export async function sendTestEmailCampaign(
  id: string,
  testEmail: string,
): Promise<{ ok: true; devLogged: boolean; messageId: string | null }> {
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}/test`, {
    method: 'POST',
    body: JSON.stringify({ testEmail }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { ok: true; devLogged: boolean; messageId: string | null };
}

export async function sendEmailCampaign(
  id: string,
  body: { confirmed: true; testEmail?: string | null },
): Promise<{ ok: true; status: string; sent: number; failed: number; skipped: number }> {
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { ok: true; status: string; sent: number; failed: number; skipped: number };
}

export async function getEmailCampaignRecipients(
  id: string,
  params?: { status?: string; search?: string; limit?: number; offset?: number },
): Promise<PlatformPagedResult<EmailCampaignRecipientAdmin>> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/email/campaigns/${id}/recipients?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPagedResult<EmailCampaignRecipientAdmin>;
}

export async function retryEmailCampaignRecipient(campaignId: string, recipientId: string): Promise<void> {
  const res = await apiFetch(
    `/api/platform-admin/email/campaigns/${campaignId}/recipients/${recipientId}/retry`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getNewsletterSubscribers(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<NewsletterSubscriberAdmin>> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/email/newsletter-subscribers?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPagedResult<NewsletterSubscriberAdmin>;
}

export async function getNotificationDeliveries(params?: {
  channel?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<NotificationDeliveryAdmin>> {
  const q = new URLSearchParams();
  if (params?.channel) q.set('channel', params.channel);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/notifications/deliveries?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPagedResult<NotificationDeliveryAdmin>;
}

export async function getAppointmentReminderFailures(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<AppointmentReminderFailureAdmin>> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/notifications/reminder-failures?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformPagedResult<AppointmentReminderFailureAdmin>;
}

export type NotificationDiagnosticsFull = {
  resendConfigured: boolean;
  resendFrom: string | null;
  telegramConfigured: boolean;
  notificationJobsEnabled: boolean;
  environment: string;
  appPublicUrl: string;
  notificationWorker: {
    enabled: boolean;
    running: boolean;
    intervalMs: number;
    lastTickAt: string | null;
    lastTickError: string | null;
    lastReport: { claimed: number; sent: number; failed: number; skipped: number } | null;
  };
  autoCompleteWorker: {
    running: boolean;
    lastTickAt: string | null;
    lastProcessed: number;
    lastError: string | null;
  };
  jobCounts: Record<string, number>;
  pendingJobs: number;
  failedJobs: number;
  lastFailedJobs: Array<{
    id: string;
    jobType: string;
    channel: string;
    lastError: string | null;
    attempts: number;
    updatedAt: string;
    appointmentId: string;
  }>;
};

export async function getNotificationDiagnosticsFull(): Promise<NotificationDiagnosticsFull> {
  const res = await apiFetch('/api/platform-admin/notifications/diagnostics');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as NotificationDiagnosticsFull;
}

export async function postTestNotificationEmail(): Promise<{ to: string; messageId: string | null }> {
  const res = await apiFetch('/api/platform-admin/notifications/test-email', { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { to: string; messageId: string | null };
}

export async function postTestNotificationTelegram(): Promise<{ status: string; skipped?: boolean }> {
  const res = await apiFetch('/api/platform-admin/notifications/test-telegram', { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { status: string; skipped?: boolean };
}

export async function postTestBookingNotification(
  bookingCode: string,
): Promise<{ to: string; messageId: string | null }> {
  const code = encodeURIComponent(bookingCode.trim().toUpperCase());
  const res = await apiFetch(`/api/platform-admin/notifications/test-booking/${code}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { to: string; messageId: string | null };
}

export async function postNotificationRetryFailed(): Promise<{ retried: number; stillFailed: number }> {
  const res = await apiFetch('/api/platform-admin/notifications/retry-failed', { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { retried: number; stillFailed: number };
}

export type PlatformSubscriptionRow = {
  subscriptionId: string;
  masterId: string;
  masterName: string | null;
  userEmail: string | null;
  planCode: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextChargeAt: string | null;
  cancelAtPeriodEnd: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  hasCardToken: boolean;
  lastPaymentAt: string | null;
  failedPaymentsCount: number;
};

export async function listPlatformSubscriptions(params?: {
  status?: string;
  planCode?: string;
  cancelAtPeriodEnd?: boolean;
  pastDue?: boolean;
  nextChargeSoon?: boolean;
  hasFailedPayments?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ subscriptions: PlatformSubscriptionRow[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.planCode) q.set('planCode', params.planCode);
  if (params?.cancelAtPeriodEnd) q.set('cancelAtPeriodEnd', 'true');
  if (params?.pastDue) q.set('pastDue', 'true');
  if (params?.nextChargeSoon) q.set('nextChargeSoon', 'true');
  if (params?.hasFailedPayments) q.set('hasFailedPayments', 'true');
  q.set('page', String(params?.page ?? 1));
  q.set('pageSize', String(params?.pageSize ?? 25));
  const res = await apiFetch(`/api/platform-admin/subscriptions?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { subscriptions: PlatformSubscriptionRow[]; total: number };
}

export type PlatformSubscriptionDetail = {
  subscription: {
    subscriptionId: string;
    masterId: string;
    masterName: string | null;
    planCode: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextChargeAt: string | null;
    cancelAtPeriodEnd: boolean;
    cardBrand: string | null;
    cardLast4: string | null;
    hasCardToken: boolean;
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    jobType: string;
    status: string;
    lastError: string | null;
  }>;
  billingEvents: Array<{ id: string; eventType: string; createdAt: string }>;
};

export async function getPlatformSubscriptionDetail(masterId: string): Promise<PlatformSubscriptionDetail> {
  const res = await apiFetch(`/api/platform-admin/subscriptions/${masterId}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformSubscriptionDetail;
}

export async function getBillingDiagnostics(): Promise<{
  recurringEnabled: boolean;
  worker: {
    enabled: boolean;
    running: boolean;
    lastTickAt: string | null;
    lastTickError: string | null;
  };
  jobs: {
    pendingJobs: number;
    pastDueCount: number;
    failedJobs24h: number;
  };
}> {
  const res = await apiFetch('/api/platform-admin/billing/diagnostics');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as Awaited<ReturnType<typeof getBillingDiagnostics>>;
}

export async function postPlatformSubscriptionCancel(masterId: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/subscriptions/${masterId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function postPlatformSubscriptionExpire(masterId: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/subscriptions/${masterId}/expire`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function postPlatformSubscriptionRetry(
  masterId: string,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const res = await apiFetch(`/api/platform-admin/subscriptions/${masterId}/retry-payment`, {
    method: 'POST',
    body: '{}',
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { paymentUrl: string; paymentId: string };
}

export async function getAccountDeletionRequests(
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending',
  opts?: { offset?: number; limit?: number },
): Promise<PlatformPagedResult<AccountDeletionRequestAdmin> & { requests: AccountDeletionRequestAdmin[] }> {
  const q = new URLSearchParams();
  q.set('status', status);
  q.set('limit', String(opts?.limit ?? PAGE_SIZE));
  q.set('offset', String(opts?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/account-deletion-requests?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    requests: AccountDeletionRequestAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return {
    requests: data.requests,
    items: data.requests,
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
}

export async function approveAccountDeletionRequest(
  id: string,
  adminNote?: string | null,
): Promise<AccountDeletionRequestAdmin> {
  const res = await apiFetch(`/api/platform-admin/account-deletion-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNote: adminNote ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { request: AccountDeletionRequestAdmin };
  return data.request;
}

export async function rejectAccountDeletionRequest(
  id: string,
  adminNote?: string | null,
): Promise<AccountDeletionRequestAdmin> {
  const res = await apiFetch(`/api/platform-admin/account-deletion-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminNote: adminNote ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { request: AccountDeletionRequestAdmin };
  return data.request;
}

export async function getPlatformSupportTickets(params?: {
  status?: string;
  severity?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<SupportTicketAdmin> & { tickets: SupportTicketAdmin[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.severity) q.set('severity', params.severity);
  if (params?.category) q.set('category', params.category);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/support/tickets?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    tickets: SupportTicketAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  return { tickets: data.tickets, items: data.tickets, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformSupportTicket(ticketCode: string): Promise<SupportTicketAdminDetail> {
  const res = await apiFetch(`/api/platform-admin/support/tickets/${encodeURIComponent(ticketCode)}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { ticket: SupportTicketAdminDetail };
  return data.ticket;
}

export async function replyPlatformSupportTicket(ticketCode: string, message: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/support/tickets/${encodeURIComponent(ticketCode)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function updatePlatformSupportTicketStatus(
  ticketCode: string,
  status: string,
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/support/tickets/${encodeURIComponent(ticketCode)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function assignPlatformSupportTicket(
  ticketCode: string,
  assignedTo: string | null,
): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/support/tickets/${encodeURIComponent(ticketCode)}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function fetchPlatformSystemStatus(): Promise<
  import('../../../features/systemStatus/systemStatusApi').PublicStatusPage
> {
  const res = await apiFetch('/api/platform-admin/system-status');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as import('../../../features/systemStatus/systemStatusApi').PublicStatusPage;
}
