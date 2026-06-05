import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_SCHEDULE_PATH,
  getMasterAdminAppointmentsPath,
  getMasterLoginPath,
  type MasterAppointmentsTabParam,
} from '../../app/paths';
import { normalizeBookingCode } from '../../shared/lib/buildBookingLink';
import {
  fetchMasterAppointmentByVoucher,
  type MasterBookingByVoucher,
} from '../../features/appointments/api/bookingByVoucher';
import { BookingAccessGate } from '../../features/appointments/components/BookingAccessGate';
import {
  patchMasterAppointmentCancel,
  patchMasterAppointmentConfirm,
} from '../../features/admin/api/masterCabinetApi';
import { hasMasterCabinetAccess } from '../../features/auth/lib/hasMasterCabinetAccess';
import { useAuth } from '../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { afterBookingMutation } from '../../features/appointments/bookingDataSync';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ожидает подтверждения';
    case 'confirmed':
      return 'Подтверждена';
    case 'completed':
      return 'Завершена';
    case 'cancelled_by_client':
    case 'cancelled_by_master':
      return 'Отменена';
    default:
      return status;
  }
}

function appointmentsTabForStatus(status: string): MasterAppointmentsTabParam | undefined {
  if (status === 'pending') return undefined;
  if (status === 'confirmed' || status === 'client_arrived' || status === 'in_progress') {
    return 'upcoming';
  }
  return 'history';
}

function MasterBookingDetailContent() {
  const { bookingCode = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [row, setRow] = useState<MasterBookingByVoucher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState(false);
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
      const appt = await fetchMasterAppointmentByVoucher(bookingCode);
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

  useEffect(() => {
    if (!row) return;
    navigate(
      getMasterAdminAppointmentsPath({
        focus: row.id,
        tab: appointmentsTabForStatus(row.status),
      }),
      { replace: true },
    );
  }, [row, navigate]);

  if (!hasMasterCabinetAccess(profile)) {
    return <Navigate to={getMasterLoginPath(window.location.pathname)} replace />;
  }

  const onConfirm = async () => {
    if (!row || busy) return;
    setBusy(true);
    try {
      await patchMasterAppointmentConfirm(row.id);
      await load();
      afterBookingMutation();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подтвердить');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!row || busy) return;
    const reason = window.prompt('Причина отмены (обязательно)');
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      await patchMasterAppointmentCancel(row.id, reason.trim());
      await load();
      afterBookingMutation();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отменить');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen className="bg-[#F1EFEF]" />;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-neutral-950">Нет доступа к записи</h1>
        <p className="mt-3 text-[15px] text-neutral-600">
          У вас нет доступа к этой записи. Войдите в нужный аккаунт мастера.
        </p>
        <Link
          to={getMasterLoginPath(window.location.pathname)}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#111827] px-6 text-[15px] font-semibold text-white"
        >
          Войти как мастер
        </Link>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-[15px] text-neutral-600">{error ?? 'Запись не найдена'}</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_APPOINTMENTS_PATH)}
          className="mt-4 text-[#F47C8C] font-semibold"
        >
          К записям
        </button>
      </div>
    );
  }

  const when = new Date(row.starts_at);
  const isPending = row.status === 'pending';
  const canCancel = row.status === 'pending' || row.status === 'confirmed';

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <Link to={ADMIN_APPOINTMENTS_PATH} className="text-[14px] font-semibold text-[#6B7280]">
        ← Записи
      </Link>

      <div className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(17,17,17,0.06)]">
        <p className="text-[13px] font-semibold text-[#B66A24]">{statusLabel(row.status)}</p>
        <h1 className="mt-2 text-[22px] font-semibold text-neutral-950">{row.service_title_snapshot}</h1>

        <dl className="mt-6 space-y-3 text-[15px]">
          <div>
            <dt className="text-neutral-500">Клиент</dt>
            <dd className="font-semibold text-neutral-900">{row.client_name}</dd>
          </div>
          {row.client_phone ? (
            <div>
              <dt className="text-neutral-500">Телефон</dt>
              <dd>
                <a href={`tel:${row.client_phone}`} className="font-semibold text-[#F47C8C]">
                  {row.client_phone}
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-neutral-500">Дата и время</dt>
            <dd className="font-semibold text-neutral-900">
              {when.toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
        </dl>

        {row.voucher_number ? (
          <p className="mt-6 text-[11px] text-neutral-400">№ {row.voucher_number}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isPending ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="min-h-12 rounded-full bg-[#111827] text-[15px] font-semibold text-white"
          >
            Подтвердить
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onCancel()}
            className="min-h-12 rounded-full border border-[#E8E4E4] bg-white text-[15px] font-semibold text-neutral-800"
          >
            Отменить
          </button>
        ) : null}
        <Link
          to={ADMIN_SCHEDULE_PATH}
          className="min-h-12 rounded-full bg-[#F1EFEF] text-center text-[15px] font-semibold leading-[3rem] text-neutral-900"
        >
          Открыть расписание
        </Link>
      </div>
    </div>
  );
}

export function MasterBookingDetailPage() {
  return (
    <BookingAccessGate role="master">
      <MasterBookingDetailContent />
    </BookingAccessGate>
  );
}
