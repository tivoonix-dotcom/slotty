import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeBookingDataRefresh } from '../../../features/appointments/bookingDataSync';
import {
  blockUser,
  getClientBookingStats,
  getPlatformBookings,
} from '../api/platformAdminApi';
import type {
  PlatformBookingListItem,
  PlatformClientBookingStats,
} from '../api/platformAdmin.types';
import { PlatformAdminBookingDetailSheet } from '../bookings/PlatformAdminBookingDetailSheet';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paCard, paFilterChip, paInput } from '../platformAdminTheme';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cancelledByLabel(by: PlatformBookingListItem['cancelledBy']) {
  if (by === 'client') return 'Клиент';
  if (by === 'master') return 'Мастер';
  return null;
}

function isBookingCodeQuery(raw: string): boolean {
  return /^SL-/i.test(raw.trim());
}

export function PlatformAdminBookingsTab() {
  const [view, setView] = useState<'bookings' | 'problem_clients'>('bookings');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [q, setQ] = useState('');
  const [clientFilterId, setClientFilterId] = useState<string | null>(null);
  const [clientFilterName, setClientFilterName] = useState<string | null>(null);

  const [bookings, setBookings] = useState<PlatformBookingListItem[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [problemClients, setProblemClients] = useState<PlatformClientBookingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PlatformBookingListItem | null>(null);

  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockBusy, setBlockBusy] = useState(false);

  const [statsPeriod, setStatsPeriod] = useState<'month' | 'week' | 'all'>('month');

  const loadBookings = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getPlatformBookings({
        status: status === 'all' ? undefined : status,
        period: period === 'all' ? undefined : period,
        q: q.trim() || undefined,
        clientId: clientFilterId ?? undefined,
        offset,
      });
      setBookingsTotal(res.total);
      setBookings((prev) => (append ? [...prev, ...res.bookings] : res.bookings));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [status, period, q, clientFilterId]);

  const loadProblemClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProblemClients(
        await getClientBookingStats({
          period: statsPeriod,
          minCancellations: 2,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [statsPeriod]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (view === 'bookings') void loadBookings(0);
      else void loadProblemClients();
    }, 300);
    return () => clearTimeout(t);
  }, [view, loadBookings, loadProblemClients]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || view !== 'bookings') return;
    setSelectedBookingId(openId);
    const hit = bookings.find((b) => b.id === openId);
    if (hit) setSelectedPreview(hit);
  }, [searchParams, bookings, view]);

  useEffect(() => {
    if (view !== 'bookings') return;
    return subscribeBookingDataRefresh(() => {
      void loadBookings(0);
    });
  }, [view, loadBookings]);

  function openBooking(b: PlatformBookingListItem) {
    setSelectedBookingId(b.id);
    setSelectedPreview(b);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('open', b.id);
      return next;
    });
  }

  function focusClient(client: PlatformClientBookingStats) {
    setView('bookings');
    setClientFilterId(client.clientId);
    setClientFilterName(client.fullName);
    setStatus('cancelled_by_client');
    setPeriod('all');
  }

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className={`${paCard} mb-5 flex flex-wrap gap-2 p-3`}>
        <button
          type="button"
          className={paFilterChip(view === 'bookings')}
          onClick={() => setView('bookings')}
        >
          Все записи
        </button>
        <button
          type="button"
          className={paFilterChip(view === 'problem_clients')}
          onClick={() => setView('problem_clients')}
        >
          Частые отмены клиентов
        </button>
      </div>

      {view === 'bookings' ? (
        <>
          <PlatformAdminToolbar
            search={{
              value: q,
              onChange: setQ,
              placeholder: 'Поиск по клиенту, мастеру, услуге или SL-коду',
            }}
            resultCount={loading ? undefined : bookingsTotal}
            filterGroups={[
              {
                label: 'Статус',
                chips: [
                  ['all', 'Все'],
                  ['pending', 'Ожидают'],
                  ['confirmed', 'Подтверждены'],
                  ['completed', 'Завершены'],
                  ['cancelled', 'Любая отмена'],
                  ['cancelled_by_client', 'Отмена клиентом'],
                  ['cancelled_by_master', 'Отмена мастером'],
                  ['no_show', 'Неявка'],
                ].map(([id, label]) => ({
                  id,
                  label,
                  active: status === id,
                  onClick: () => setStatus(id),
                })),
              },
              {
                label: 'Период',
                chips: [
                  ['all', 'Все даты'],
                  ['today', 'Сегодня'],
                  ['week', '7 дней'],
                  ['month', '30 дней'],
                ].map(([id, label]) => ({
                  id,
                  label,
                  active: period === id,
                  onClick: () => setPeriod(id),
                })),
              },
            ]}
          />

          {clientFilterId && clientFilterName ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-[14px]">
              <span>
                Записи клиента: <strong>{clientFilterName}</strong>
              </span>
              <button
                type="button"
                className="font-semibold text-[#ff5f7a]"
                onClick={() => {
                  setClientFilterId(null);
                  setClientFilterName(null);
                }}
              >
                Сбросить
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className={`${paCard} mb-5 space-y-3 p-4`}>
          <p className="text-[14px] text-[#6B7280]">
            Клиенты с двумя и более отменами записи самостоятельно. Можно открыть историю или
            заблокировать аккаунт.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['month', '30 дней'],
                ['week', '7 дней'],
                ['all', 'Всё время'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={paFilterChip(statsPeriod === id)}
                onClick={() => setStatsPeriod(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? <PlatformAdminLoading /> : null}
      {error ? (
        <PlatformAdminError
          message={error}
          onRetry={() => (view === 'bookings' ? void loadBookings(0) : void loadProblemClients())}
        />
      ) : null}

      {view === 'bookings' && !loading && !error && bookings.length === 0 ? (
        <PlatformAdminEmpty
          title={isBookingCodeQuery(q) ? 'Запись с таким кодом не найдена.' : 'Записей нет'}
          text={
            isBookingCodeQuery(q)
              ? 'Проверьте SL-код или сбросьте фильтры.'
              : 'Измените фильтры или сбросьте клиента.'
          }
        />
      ) : null}

      {view === 'problem_clients' && !loading && !error && problemClients.length === 0 ? (
        <PlatformAdminEmpty
          title="Подозрительных клиентов нет"
          text="За выбранный период нет клиентов с 2+ отменами."
        />
      ) : null}

      {view === 'bookings' && !loading && !error ? (
        <div className="space-y-3">
          {bookings.map((b) => {
            const who = cancelledByLabel(b.cancelledBy);
            return (
              <PlatformAdminCard key={b.id}>
                <button type="button" className="w-full text-left" onClick={() => openBooking(b)}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#111827]">{b.serviceTitle}</h3>
                      <p className="mt-1 text-[14px] text-[#6B7280]">
                        <span className="font-semibold text-[#374151]">{b.clientName}</span> →{' '}
                        {b.masterName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={b.status} />
                      {who ? (
                        <span className="text-[11px] font-semibold text-rose-700">Отменил: {who}</span>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-[15px] font-semibold text-[#111827]">{formatWhen(b.startsAt)}</p>
                  {b.bookingCode ? (
                    <p className="mt-1 font-mono text-[12px] text-[#6B7280]">{b.bookingCode}</p>
                  ) : null}
                  <p className="text-[13px] text-[#6B7280]">
                    {b.priceSnapshot.toLocaleString('ru-RU')} ₽ · создана {formatWhen(b.createdAt)}
                  </p>

                  {b.cancelReason ? (
                    <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-900">
                      {b.cancelReason}
                    </p>
                  ) : null}

                  <p className="mt-2 text-[13px] font-semibold text-[#ff5f7a]">Подробности записи →</p>
                </button>
              </PlatformAdminCard>
            );
          })}
          <PlatformAdminLoadMore
            loadedCount={bookings.length}
            total={bookingsTotal}
            loading={loadingMore}
            onLoadMore={() => void loadBookings(bookings.length)}
          />
        </div>
      ) : null}

      {view === 'problem_clients' && !loading && !error ? (
        <div className="space-y-3">
          {problemClients.map((c) => (
            <PlatformAdminCard key={c.clientId}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">{c.fullName}</h3>
                  <p className="mt-0.5 text-[14px] text-[#6B7280]">{c.email ?? 'Email не указан'}</p>
                  <p className="font-mono text-[11px] text-[#9CA3AF]">{c.clientId}</p>
                </div>
                <StatusBadge status={c.accountStatus} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-[#9CA3AF]">Всего</dt>
                  <dd className="font-bold">{c.totalBookings}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Отмены клиентом</dt>
                  <dd className="font-bold text-rose-700">{c.cancellationsByClient}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Отмены мастером</dt>
                  <dd className="font-bold">{c.cancellationsByMaster}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Завершено</dt>
                  <dd className="font-bold text-emerald-700">{c.completed}</dd>
                </div>
              </dl>

              {c.lastCancellationAt ? (
                <p className="mt-2 text-[12px] text-[#6B7280]">
                  Последняя отмена: {formatWhen(c.lastCancellationAt)}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef0f5] pt-3">
                <button
                  type="button"
                  className="text-[13px] font-semibold text-[#ff5f7a]"
                  onClick={() => focusClient(c)}
                >
                  Все записи клиента
                </button>
                {c.accountStatus !== 'blocked' ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#ef4444]"
                    onClick={() => setBlockTarget({ id: c.clientId, name: c.fullName })}
                  >
                    Заблокировать
                  </button>
                ) : null}
              </div>
            </PlatformAdminCard>
          ))}
        </div>
      ) : null}

      <PlatformAdminBookingDetailSheet
        bookingId={selectedBookingId}
        listPreview={selectedPreview}
        onClose={() => {
          setSelectedBookingId(null);
          setSelectedPreview(null);
        }}
        onBlockClient={(id, name) => setBlockTarget({ id, name })}
        onViewClientBookings={(clientId) => {
          setSelectedBookingId(null);
          setSelectedPreview(null);
          const name = bookings.find((b) => b.clientId === clientId)?.clientName ?? 'Клиент';
          setClientFilterId(clientId);
          setClientFilterName(name);
          setView('bookings');
          setStatus('all');
        }}
      />

      <ConfirmModal
        open={Boolean(blockTarget)}
        title={`Заблокировать ${blockTarget?.name ?? 'клиента'}?`}
        description="Клиент не сможет записываться и входить в приложение. Укажите причину — она уйдёт в журнал."
        confirmLabel="Заблокировать"
        danger
        busy={blockBusy}
        onConfirm={async () => {
          if (!blockTarget || !blockReason.trim()) return;
          setBlockBusy(true);
          try {
            await blockUser(blockTarget.id, blockReason.trim());
            setBlockTarget(null);
            setBlockReason('');
            if (view === 'bookings') await loadBookings(0);
            else await loadProblemClients();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка');
          } finally {
            setBlockBusy(false);
          }
        }}
        onClose={() => setBlockTarget(null)}
      >
        <textarea
          className={`${paInput} min-h-[80px]`}
          placeholder="Причина блокировки *"
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}
