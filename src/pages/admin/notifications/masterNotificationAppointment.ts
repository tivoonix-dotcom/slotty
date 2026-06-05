import { useCallback, useEffect, useState } from 'react';
import {
  fetchMasterAppointmentById,
  fetchMasterAppointmentByVoucher,
  type MasterBookingByVoucher,
} from '../../../features/appointments/api/bookingByVoucher';
import { dbStatusToUi } from '../../../features/appointments/appointmentStatus';
import { subscribeBookingDataRefresh } from '../../../features/appointments/bookingDataSync';
import { isoDateLocal, type DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import {
  resolveMetadataFallback,
  resolveNotificationBookingKeys,
  type MasterNotificationBookingExtras,
  type NotificationBookingDataSource,
} from '../../../features/notifications/bookingNotificationMetadata';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import { clientNameInputForResolve } from '../appointments/appointmentsFormat';

export type { MasterNotificationBookingExtras, NotificationBookingDataSource };

function formatHmLocal(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function masterBookingToDemoAppointment(row: MasterBookingByVoucher): DemoMasterAppointment {
  const d = new Date(row.starts_at);
  const date = isoDateLocal(d);
  const time = formatHmLocal(d);
  const price = Number(row.price_snapshot);

  return {
    id: row.id,
    serviceId: row.service_id,
    slotId: row.slot_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    clientName:
      resolveNotificationClientName({
        full_name: clientNameInputForResolve(row.client_name),
        phone: row.client_phone,
        telegram_username: row.client_telegram_username,
      }) ??
      clientNameInputForResolve(row.client_name) ??
      'Клиент',
    clientAvatarUrl: row.client_avatar_url,
    serviceTitle: row.service_title_snapshot,
    date,
    time,
    timeLabel: time,
    priceByn: Number.isFinite(price) ? price : 0,
    contact: row.client_phone ?? undefined,
    clientNote: row.client_note ?? undefined,
    clientReferencePhotoUrl: row.client_reference_photo_url ?? undefined,
    status: dbStatusToUi(row.status),
    dbStatus: row.status,
    voucherNumber: row.voucher_number,
    durationMinutes: row.service_duration_snapshot ?? undefined,
    bookingSource: row.booking_source ?? null,
    clientEmail: row.client_email ?? null,
    clientTelegramUsername: row.client_telegram_username?.replace(/^@+/, '') ?? null,
    addressShort: row.location_public_address ?? undefined,
    pendingExpiresAt: row.pending_expires_at ?? null,
  };
}

export function masterBookingExtras(row: MasterBookingByVoucher): MasterNotificationBookingExtras {
  return {
    visitType: row.visit_type ?? null,
    serviceCategory: row.service_category_name ?? null,
    cancelReason: row.cancel_reason ?? null,
  };
}

const APPOINTMENT_NOTIFY_TYPES = new Set([
  'appointment_new',
  'appointment_pending',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
]);

export function isAppointmentNotification(item: MeNotificationRow): boolean {
  return item.related_entity_type === 'appointment' || APPOINTMENT_NOTIFY_TYPES.has(item.type);
}

function mapFetchError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  if (/not found|не найден/i.test(msg)) return 'Запись не найдена';
  return msg || 'Не удалось загрузить детали записи';
}

async function fetchBookingLive(bookingCode: string | null, bookingId: string | null): Promise<MasterBookingByVoucher> {
  if (bookingCode) return fetchMasterAppointmentByVoucher(bookingCode);
  if (bookingId) return fetchMasterAppointmentById(bookingId);
  throw new Error('Не удалось загрузить детали записи');
}

export function useMasterNotificationAppointment(item: MeNotificationRow | null) {
  const [appointment, setAppointment] = useState<DemoMasterAppointment | null>(null);
  const [extras, setExtras] = useState<MasterNotificationBookingExtras | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<NotificationBookingDataSource>(null);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!item || !isAppointmentNotification(item)) {
      setAppointment(null);
      setExtras(null);
      setLoading(false);
      setError(null);
      setDataSource(null);
      return;
    }

    const { bookingCode, bookingId } = resolveNotificationBookingKeys(item);
    const metadataFallback = resolveMetadataFallback(item);
    const hasLiveKey = Boolean(bookingCode || bookingId);

    if (!hasLiveKey && !metadataFallback) {
      setAppointment(null);
      setExtras(null);
      setLoading(false);
      setError('Не удалось загрузить детали записи');
      setDataSource(null);
      return;
    }

    if (!opts?.quiet) setLoading(true);
    setError(null);

    try {
      if (hasLiveKey) {
        try {
          const row = await fetchBookingLive(bookingCode, bookingId);
          setAppointment(masterBookingToDemoAppointment(row));
          setExtras(masterBookingExtras(row));
          setDataSource('live');
          return;
        } catch (e) {
          if (metadataFallback) {
            setAppointment(metadataFallback.appointment);
            setExtras(metadataFallback.extras);
            setDataSource('metadata');
            setError(null);
            return;
          }
          setAppointment(null);
          setExtras(null);
          setDataSource(null);
          setError(mapFetchError(e));
          return;
        }
      }

      setAppointment(metadataFallback!.appointment);
      setExtras(metadataFallback!.extras);
      setDataSource('metadata');
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!item) return;
    return subscribeBookingDataRefresh(() => {
      void load({ quiet: true });
    });
  }, [item, load]);

  useEffect(() => {
    if (!item) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load({ quiet: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [item, load]);

  return { appointment, extras, loading, error, dataSource, refetch: load };
}
