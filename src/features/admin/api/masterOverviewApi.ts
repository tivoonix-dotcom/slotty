import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import { afterBookingMutation } from '../../appointments/bookingDataSync';
import type { OverviewDayStat } from '../../master/model/demoMasterAppointments';
import type { DemoMasterAppointment } from '../../master/model/demoMasterAppointments';
import type {
  ClientAnalytics,
  OverviewPeriodPreset,
  RevenueAnalytics,
} from '../../../pages/admin/overview/overviewAnalytics';
import type {
  MasterOverviewReview,
  ReputationAnalyticsPayload,
} from '../../../pages/admin/overview/overviewReputationDemo';

async function readApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type OverviewSummaryApiDto = {
  totalRevenue: number;
  totalVisits: number;
  nearest: DemoMasterAppointment | null;
  hasAny: boolean;
  dayStats: OverviewDayStat[];
  periodStart: string;
  periodEnd: string;
};

function overviewQuery(period: OverviewPeriodPreset): string {
  return `?period=${encodeURIComponent(period)}`;
}

export type OverviewBundleApiDto = {
  summary: OverviewSummaryApiDto;
  revenue: RevenueAnalytics;
  clients: ClientAnalytics;
  reputation: ReputationAnalyticsPayload;
  periodStart: string;
  periodEnd: string;
};

export async function fetchOverviewBundle(period: OverviewPeriodPreset): Promise<OverviewBundleApiDto> {
  const res = await apiFetch(`/api/masters/me/overview/bundle${overviewQuery(period)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as OverviewBundleApiDto;
}

export async function fetchOverviewSummary(period: OverviewPeriodPreset): Promise<OverviewSummaryApiDto> {
  const res = await apiFetch(`/api/masters/me/overview/summary${overviewQuery(period)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as OverviewSummaryApiDto;
}

export async function fetchOverviewRevenue(period: OverviewPeriodPreset): Promise<RevenueAnalytics> {
  const res = await apiFetch(`/api/masters/me/overview/revenue${overviewQuery(period)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as RevenueAnalytics & { periodStart?: string; periodEnd?: string };
  const { periodStart: _s, periodEnd: _e, ...data } = j;
  return data;
}

export type OverviewPeriodBounds = { periodStart: string; periodEnd: string };

type OverviewClientsApiDto = ClientAnalytics & OverviewPeriodBounds;
type OverviewReputationApiDto = ReputationAnalyticsPayload & OverviewPeriodBounds;

export async function fetchOverviewClients(
  period: OverviewPeriodPreset,
): Promise<OverviewClientsApiDto> {
  const res = await apiFetch(`/api/masters/me/overview/clients${overviewQuery(period)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as OverviewClientsApiDto;
}

export async function fetchOverviewReputation(
  period: OverviewPeriodPreset,
): Promise<OverviewReputationApiDto> {
  const res = await apiFetch(`/api/masters/me/overview/reputation${overviewQuery(period)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as OverviewReputationApiDto;
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

export async function fetchMasterReviewNotificationDetail(
  reviewId: string,
): Promise<MasterReviewNotificationDetail> {
  const res = await apiFetch(`/api/masters/me/overview/reviews/${encodeURIComponent(reviewId)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { review?: MasterReviewNotificationDetail };
  if (!data.review) throw new Error('Отзыв не найден');
  return data.review;
}

export async function postOverviewReviewReply(reviewId: string, text: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/overview/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (res.status === 409) {
    throw new Error('ALREADY_REPLIED');
  }
  if (!res.ok) throw new Error(await readApiError(res));
  afterBookingMutation();
}

export type { MasterOverviewReview };
