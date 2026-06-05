import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeBookingDataRefresh } from '../../../features/appointments/bookingDataSync';
import {
  getClientAppointmentPath,
  getMasterAppointmentPath,
  getMasterPath,
  PLATFORM_ADMIN_MASTERS_PATH,
  PLATFORM_ADMIN_USERS_PATH,
} from '../../../app/paths';
import { getPlatformBooking } from '../api/platformAdminApi';
import type { PlatformBookingDetail, PlatformBookingListItem } from '../api/platformAdmin.types';
import {
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { paCard, paGhostBtn } from '../platformAdminTheme';
import { PlatformAdminBookingAuditPanel } from './PlatformAdminBookingAuditPanel';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cancelledByLabel(by: PlatformBookingListItem['cancelledBy']) {
  if (by === 'client') return 'Отменил клиент';
  if (by === 'master') return 'Отменил мастер';
  return null;
}

type Props = {
  bookingId: string | null;
  listPreview?: PlatformBookingListItem | null;
  onClose: () => void;
  onBlockClient: (clientId: string, clientName: string) => void;
  onViewClientBookings: (clientId: string) => void;
};

export function PlatformAdminBookingDetailSheet({
  bookingId,
  listPreview,
  onClose,
  onBlockClient,
  onViewClientBookings,
}: Props) {
  const [detail, setDetail] = useState<PlatformBookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auditSectionRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await getPlatformBooking(bookingId));
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) {
      setDetail(null);
      return;
    }
    void load();
  }, [bookingId, load]);

  useEffect(() => {
    if (!bookingId) return;
    return subscribeBookingDataRefresh(() => {
      void load();
    });
  }, [bookingId, load]);

  if (!bookingId) return null;

  const title = detail?.serviceTitle ?? listPreview?.serviceTitle ?? 'Запись';
  const cancelLabel = detail ? cancelledByLabel(detail.cancelledBy) : null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className={`${paCard} flex h-full w-full max-w-lg flex-col rounded-none border-0 shadow-2xl sm:rounded-l-3xl`}
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#eef0f5] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold text-[#111827]">{title}</h2>
              <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">
                {detail?.bookingCode ?? listPreview?.bookingCode ?? bookingId}
              </p>
            </div>
            <button type="button" className={paGhostBtn} onClick={onClose}>
              Закрыть
            </button>
          </div>
          {detail ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.clientAccountStatus} />
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? <PlatformAdminLoading rows={4} /> : null}
          {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

          {detail && !loading && !error ? (
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#eef0f5] bg-white px-4 py-3">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Код записи</p>
                <p className="mt-1 font-mono text-[15px] font-bold text-[#111827]">
                  {detail.bookingCode ?? '—'}
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
                  <div>
                    <dt className="text-[#9CA3AF]">Отзыв</dt>
                    <dd className="font-semibold text-[#111827]">
                      {detail.hasReview ? 'Оставлен' : 'Нет'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Уведомления</dt>
                    <dd className="font-semibold text-[#111827]">
                      {detail.notificationJobs.total === 0
                        ? 'Нет jobs'
                        : `${detail.notificationJobs.total} · pending ${detail.notificationJobs.pending} · failed ${detail.notificationJobs.failed}`}
                    </dd>
                  </div>
                  {detail.pendingConfirmDeadline ? (
                    <div className="sm:col-span-2">
                      <dt className="text-[#9CA3AF]">Подтвердить до</dt>
                      <dd className="font-semibold text-amber-800">
                        {formatWhen(detail.pendingConfirmDeadline)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {detail.bookingCode ? (
                    <>
                      <Link
                        to={getClientAppointmentPath(detail.bookingCode)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-[12px] font-semibold text-[#374151]"
                      >
                        Запись клиента
                      </Link>
                      <Link
                        to={getMasterAppointmentPath(detail.bookingCode)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-[12px] font-semibold text-[#374151]"
                      >
                        Запись мастера
                      </Link>
                    </>
                  ) : null}
                  <Link
                    to={getMasterPath(detail.masterId)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-[12px] font-semibold text-[#374151]"
                  >
                    Публичный профиль
                  </Link>
                  <Link
                    to={PLATFORM_ADMIN_MASTERS_PATH}
                    className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-[12px] font-semibold text-[#374151]"
                  >
                    Мастера
                  </Link>
                  <Link
                    to={PLATFORM_ADMIN_USERS_PATH}
                    className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-[12px] font-semibold text-[#374151]"
                  >
                    Пользователи
                  </Link>
                  <button
                    type="button"
                    className="rounded-xl bg-[#ff5f7a] px-3 py-2 text-[12px] font-semibold text-white"
                    onClick={() =>
                      auditSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    Аудит записи
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Визит</p>
                <p className="mt-1 text-[16px] font-bold text-[#111827]">{formatWhen(detail.startsAt)}</p>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Мастер: {detail.masterName} · {detail.priceSnapshot.toLocaleString('ru-RU')} ₽
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Клиент
                </h3>
                <p className="text-[16px] font-bold text-[#111827]">{detail.clientName}</p>
                <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">{detail.clientId}</p>
                <dl className="mt-3 space-y-2 text-[14px]">
                  {detail.clientEmail ? (
                    <div>
                      <dt className="text-[#9CA3AF]">Email</dt>
                      <dd className="font-medium text-[#111827]">{detail.clientEmail}</dd>
                    </div>
                  ) : null}
                  {detail.clientPhone ? (
                    <div>
                      <dt className="text-[#9CA3AF]">Телефон</dt>
                      <dd className="font-medium text-[#111827]">{detail.clientPhone}</dd>
                    </div>
                  ) : null}
                  {detail.clientTelegramUsername ? (
                    <div>
                      <dt className="text-[#9CA3AF]">Telegram</dt>
                      <dd className="font-medium text-[#111827]">@{detail.clientTelegramUsername}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-[#ff5f7a] px-4 py-2 text-[13px] font-semibold text-white"
                    onClick={() => onBlockClient(detail.clientId, detail.clientName)}
                  >
                    Заблокировать клиента
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[13px] font-semibold text-[#374151]"
                    onClick={() => onViewClientBookings(detail.clientId)}
                  >
                    Все записи клиента
                  </button>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Статистика клиента
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt className="text-[#9CA3AF]">Всего записей</dt>
                    <dd className="font-bold text-[#111827]">{detail.clientStats.totalBookings}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Отмены клиентом</dt>
                    <dd className="font-bold text-rose-700">{detail.clientStats.cancellationsByClient}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Отмены мастером</dt>
                    <dd className="font-bold text-[#111827]">{detail.clientStats.cancellationsByMaster}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Неявки</dt>
                    <dd className="font-bold text-[#111827]">{detail.clientStats.noShows}</dd>
                  </div>
                </dl>
                {detail.clientStats.cancellationsByClient >= 3 ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                    Много отмен со стороны клиента — рассмотрите ограничение или блокировку.
                  </p>
                ) : null}
              </section>

              {(cancelLabel || detail.cancelReason) && (
                <section className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p className="text-[12px] font-bold uppercase text-rose-800">Отмена</p>
                  {cancelLabel ? (
                    <p className="mt-1 text-[15px] font-semibold text-rose-900">{cancelLabel}</p>
                  ) : null}
                  <p className="mt-1 text-[13px] text-rose-800">
                    Обновлено: {formatWhen(detail.updatedAt)}
                  </p>
                  {cancelLabel ? (
                    <p className="mt-2 text-[14px] text-rose-900">
                      Причина: {detail.cancelReason?.trim() || 'не указана'}
                    </p>
                  ) : detail.cancelReason ? (
                    <p className="mt-2 text-[14px] text-rose-900">Причина: {detail.cancelReason}</p>
                  ) : (
                    <p className="mt-2 text-[14px] text-rose-700">Причина не указана</p>
                  )}
                </section>
              )}

              {detail.clientNote ? (
                <section>
                  <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                    Комментарий клиента
                  </h3>
                  <p className="rounded-xl bg-[#f6f7fb] px-3 py-2 text-[14px] text-[#374151]">
                    {detail.clientNote}
                  </p>
                </section>
              ) : null}

              {detail.recentBookings.length > 0 ? (
                <section>
                  <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                    Другие записи клиента
                  </h3>
                  <ul className="space-y-2">
                    {detail.recentBookings.map((b) => (
                      <li key={b.id} className="rounded-xl bg-[#f6f7fb] px-3 py-2 text-[13px]">
                        <span className="font-semibold text-[#111827]">{b.serviceTitle}</span>
                        <span className="text-[#6B7280]"> · {b.masterName}</span>
                        <br />
                        <StatusBadge status={b.status} />
                        <span className="ml-2 text-[#9CA3AF]">{formatWhen(b.startsAt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section ref={auditSectionRef}>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Аудит записи
                </h3>
                <PlatformAdminBookingAuditPanel
                  bookingCode={detail.bookingCode}
                  onResolved={() => void load()}
                />
              </section>

              <p className="text-[12px] text-[#9CA3AF]">Создана: {formatWhen(detail.createdAt)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
