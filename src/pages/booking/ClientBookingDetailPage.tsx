import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { getClientAppointmentReviewPath, getProfilePath, LOGIN_PATH } from '../../app/paths';
import { fetchClientAppointmentByVoucher } from '../../features/appointments/api/bookingByVoucher';
import { ClientAppointmentDetailView } from '../../features/appointments/clientBooking/ClientAppointmentDetailView';
import {
  clientBookingBackLink,
  clientBookingCanvasClass,
  clientBookingDesktopShellClass,
} from '../../features/appointments/clientBooking/clientBookingDetailTheme';
import type { ClientBookingDetail } from '../../features/appointments/clientBooking/clientBookingDetailTypes';
import { BookingAccessGate } from '../../features/appointments/components/BookingAccessGate';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { normalizeBookingCode } from '../../shared/lib/buildBookingLink';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../client/clientNavConstants';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

function ClientBookingDetailShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        className={`lg:hidden min-h-dvh ${clientBookingCanvasClass} ${CLIENT_CONTENT_PAD_BOTTOM} ${CLIENT_HEADER_OFFSET}`}
      >
        <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-3">{children}</div>
      </div>

      <div className={`hidden lg:block min-h-dvh ${clientBookingCanvasClass}`}>
        <div className={clientBookingDesktopShellClass}>{children}</div>
      </div>
    </>
  );
}

function ClientBookingDetailContent() {
  const { bookingCode = '' } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<ClientBookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const normalizedCode = useMemo(() => {
    try {
      return normalizeBookingCode(bookingCode);
    } catch {
      return '';
    }
  }, [bookingCode]);

  const load = useCallback(async () => {
    if (!getApiBaseUrl()) {
      setError('Сервер недоступен');
      setLoading(false);
      return;
    }
    if (!normalizedCode) {
      setError('Некорректный номер записи');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const appt = await fetchClientAppointmentByVoucher(normalizedCode);
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
  }, [normalizedCode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={`min-h-dvh ${clientBookingCanvasClass} ${CLIENT_HEADER_OFFSET} lg:pt-0`}>
        <LoadingScreen className={clientBookingCanvasClass} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <ClientBookingDetailShell>
        <div className="text-center lg:text-left">
          <h1 className="text-xl font-bold text-[#111827] lg:text-[26px] lg:tracking-[-0.04em]">
            Нет доступа к записи
          </h1>
          <p className="mt-3 text-[15px] text-[#6B7280]">
            У вас нет доступа к этой записи. Войдите в нужный аккаунт.
          </p>
          <Link
            to={`${LOGIN_PATH}?from=${encodeURIComponent(window.location.pathname)}`}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#111827] px-6 text-[15px] font-semibold text-white"
          >
            Войти
          </Link>
        </div>
      </ClientBookingDetailShell>
    );
  }

  if (error && !row) {
    return (
      <ClientBookingDetailShell>
        <Link to={getProfilePath('appointments')} className={clientBookingBackLink}>
          <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Мои записи
        </Link>
        <p className="mt-6 text-[15px] text-[#6B7280]">{error}</p>
      </ClientBookingDetailShell>
    );
  }

  if (!row) return null;

  return (
    <ClientBookingDetailShell>
      <ClientAppointmentDetailView
        detail={row}
        layout="page"
        onRefresh={load}
        onOpenReview={() => {
          if (row.voucher_number) {
            navigate(getClientAppointmentReviewPath(row.voucher_number));
          }
        }}
        onRebook={(masterId) => navigate(`/master/${masterId}`)}
      />
    </ClientBookingDetailShell>
  );
}

export function ClientBookingDetailPage() {
  return (
    <BookingAccessGate role="client">
      <ClientBookingDetailContent />
    </BookingAccessGate>
  );
}
