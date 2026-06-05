import { useCallback, useEffect, useState } from 'react';
import {
  fetchMasterReviewNotificationDetail,
  type MasterReviewNotificationDetail,
} from '../../../features/admin/api/masterOverviewApi';
import {
  parseBookingNotificationMetadata,
  resolveReviewNotificationKeys,
} from '../../../features/notifications/bookingNotificationMetadata';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';

export function isReviewNotification(item: MeNotificationRow): boolean {
  const title = item.title.trim().toLowerCase();
  return item.related_entity_type === 'review' || title.includes('отзыв');
}

function detailFromMetadata(item: MeNotificationRow): MasterReviewNotificationDetail | null {
  const meta = parseBookingNotificationMetadata(item.metadata);
  if (!meta?.reviewRating) return null;

  const summary = parseNotificationSummary(item);
  const clientName =
    meta.clientName?.trim() ||
    summary.find((r) => r.label === 'Клиент')?.value ||
    null;
  const serviceName =
    meta.serviceName?.trim() ||
    summary.find((r) => r.label === 'Услуга')?.value ||
    null;
  const visitAt = summary.find((r) => r.label === 'Когда')?.value ?? null;

  if (!clientName && !serviceName) return null;

  const visitDate = meta.startsAt ? new Date(meta.startsAt) : null;
  const visitAtFormatted =
    visitAt ??
    (visitDate && !Number.isNaN(visitDate.getTime())
      ? visitDate.toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Дата не указана');

  return {
    reviewId: meta.reviewId ?? item.related_entity_id ?? '',
    rating: meta.reviewRating,
    body: meta.reviewBody?.trim() || '',
    createdAt: item.created_at,
    appointmentId: meta.bookingId,
    bookingCode: meta.bookingCode ?? null,
    clientName:
      resolveNotificationClientName({
        full_name: clientName,
        phone: meta?.clientPhone ?? null,
      }) ?? 'Клиент',
    clientPhone: meta.clientPhone ?? null,
    clientAvatarUrl: null,
    serviceName: serviceName ?? 'Услуга',
    visitAt: visitAtFormatted,
  };
}

export function useMasterNotificationReview(item: MeNotificationRow | null) {
  const [review, setReview] = useState<MasterReviewNotificationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!item || !isReviewNotification(item)) {
      setReview(null);
      setLoading(false);
      setError(null);
      return;
    }

    const metadataFallback = detailFromMetadata(item);
    const { reviewId } = resolveReviewNotificationKeys(item);

    if (!reviewId) {
      setReview(metadataFallback);
      setLoading(false);
      setError(metadataFallback ? null : 'Не удалось загрузить отзыв');
      return;
    }

    if (!opts?.quiet) setLoading(true);
    setError(null);

    try {
      const live = await fetchMasterReviewNotificationDetail(reviewId);
      setReview(live);
    } catch (e) {
      if (metadataFallback) {
        setReview(metadataFallback);
        setError(null);
      } else {
        setReview(null);
        setError(e instanceof Error ? e.message : 'Не удалось загрузить отзыв');
      }
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    void load();
  }, [load]);

  return { review, loading, error, refetch: load };
}
