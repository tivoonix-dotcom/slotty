import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProfilePath, LOGIN_PATH } from '../../app/paths';
import { fetchClientAppointmentByVoucher } from '../../features/appointments/api/bookingByVoucher';
import { ClientAppointmentDetailView } from '../../features/appointments/clientBooking/ClientAppointmentDetailView';
import type { ClientBookingDetail } from '../../features/appointments/clientBooking/clientBookingDetailTypes';
import { BookingAccessGate } from '../../features/appointments/components/BookingAccessGate';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { normalizeBookingCode } from '../../shared/lib/buildBookingLink';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

function ClientBookingDetailContent() {
  const { bookingCode = '' } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<ClientBookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getApiBaseUrl()) {
      setError('Сервер недоступен');
      setLoading(false);
      return;
    }
    try {
      normalizeBookingCode(bookingCode);
    } catch {
      setError('Некорректный номер записи');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const appt = await fetchClientAppointmentByVoucher(bookingCode);
      setRow(appt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить запись';
      if (msg.toLowerCase().includes('доступ') || msg.includes('403')) {
        setForbidden(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingCode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen className="bg-white" />;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-neutral-950">Нет доступа к записи</h1>
        <p className="mt-3 text-[15px] text-neutral-600">
          У вас нет доступа к этой записи. Войдите в нужный аккаунт.
        </p>
        <Link
          to={`${LOGIN_PATH}?from=${encodeURIComponent(window.location.pathname)}`}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#111827] px-6 text-[15px] font-semibold text-white"
        >
          Войти
        </Link>
      </div>
    );
  }

  if (error && !row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-[15px] text-neutral-600">{error}</p>
        <Link to={getProfilePath('appointments')} className="mt-4 inline-block font-semibold text-[#F47C8C]">
          Мои записи
        </Link>
      </div>
    );
  }

  if (!row) return null;

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <ClientAppointmentDetailView
        detail={row}
        layout="page"
        onRefresh={load}
        onOpenReview={(id) => navigate(`${getProfilePath('appointments')}?review=${id}`)}
        onRebook={(masterId) => navigate(`/master/${masterId}`)}
      />
    </div>
  );
}

export function ClientBookingDetailPage() {
  return (
    <BookingAccessGate role="client">
      <ClientBookingDetailContent />
    </BookingAccessGate>
  );
}
