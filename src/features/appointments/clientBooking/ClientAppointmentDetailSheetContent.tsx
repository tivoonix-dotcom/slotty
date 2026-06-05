import { useCallback, useEffect, useState } from 'react';
import { fetchClientAppointmentByVoucher } from '../api/bookingByVoucher';
import type { DemoAppointmentRecord } from '../model/demoAppointments';
import { ClientAppointmentDetailView } from './ClientAppointmentDetailView';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { LoadingPanel } from '../../../shared/ui/LoadingVideo';

type Props = {
  row: DemoAppointmentRecord;
  onClose: () => void;
  onRefreshList: () => void | Promise<void>;
  onOpenReview?: () => void;
};

export function ClientAppointmentDetailSheetContent({
  row,
  onClose,
  onRefreshList,
  onOpenReview,
}: Props) {
  const [detail, setDetail] = useState<ClientBookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const code = row.voucherNumber?.trim();

  const load = useCallback(async () => {
    if (!code) {
      setError('Номер записи недоступен');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const appt = await fetchClientAppointmentByVoucher(code);
      setDetail(appt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить запись');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
    await onRefreshList();
  }, [load, onRefreshList]);

  if (loading) {
    return <LoadingPanel label="Загрузка записи…" className="py-12" />;
  }

  if (error || !detail) {
    return (
      <div>
        <h2 className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">Детали записи</h2>
        <p className="mt-4 text-[15px] text-neutral-600">{error ?? 'Запись не найдена'}</p>
        <button type="button" className="mt-4 text-[14px] font-semibold text-[#F47C8C]" onClick={onClose}>
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2
        id="appointment-details-title"
        className="mb-4 text-[26px] font-semibold tracking-[-0.055em] text-neutral-950"
      >
        Детали записи
      </h2>
      <ClientAppointmentDetailView
        detail={detail}
        layout="sheet"
        onRefresh={refresh}
        onClose={onClose}
        onOpenReview={onOpenReview}
        onRebook={() => {
          window.location.href = `/master/${detail.master_id}`;
        }}
      />
    </div>
  );
}
