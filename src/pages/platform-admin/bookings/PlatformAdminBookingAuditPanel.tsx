import { useCallback, useEffect, useState } from 'react';
import {
  getPlatformBookingAudit,
  getPlatformBookingDisputes,
  getPlatformBookingEvents,
  getPlatformBookingNotifications,
  resolvePlatformBookingDispute,
  type PlatformBookingAuditSummary,
  type PlatformBookingDisputeRow,
  type PlatformBookingEventRow,
  type PlatformBookingNotificationJob,
} from '../api/platformAdminApi';
import { PlatformAdminError, PlatformAdminLoading, StatusBadge } from '../shared/PlatformAdminSharedUi';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import { paGhostBtn } from '../platformAdminTheme';

type TabId = 'overview' | 'events' | 'disputes' | 'notifications';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'events', label: 'События' },
  { id: 'disputes', label: 'Жалобы' },
  { id: 'notifications', label: 'Уведомления' },
];

const RESOLUTION_BUTTONS = [
  { resolution: 'client_supported' as const, label: 'В пользу клиента' },
  { resolution: 'master_supported' as const, label: 'В пользу мастера' },
  { resolution: 'neutral' as const, label: 'Нейтрально' },
  { resolution: 'rejected' as const, label: 'Отклонить жалобу' },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  bookingCode: string | null;
  onResolved?: () => void;
};

export function PlatformAdminBookingAuditPanel({ bookingCode, onResolved }: Props) {
  const [tab, setTab] = useState<TabId>('overview');
  const [audit, setAudit] = useState<PlatformBookingAuditSummary | null>(null);
  const [events, setEvents] = useState<PlatformBookingEventRow[]>([]);
  const [disputes, setDisputes] = useState<PlatformBookingDisputeRow[]>([]);
  const [openDisputeId, setOpenDisputeId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<PlatformBookingNotificationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveBusy, setResolveBusy] = useState(false);

  const load = useCallback(async () => {
    if (!bookingCode) return;
    setLoading(true);
    setError(null);
    try {
      const [auditRes, evRes, dispRes, notifRes] = await Promise.all([
        getPlatformBookingAudit(bookingCode),
        getPlatformBookingEvents(bookingCode),
        getPlatformBookingDisputes(bookingCode),
        getPlatformBookingNotifications(bookingCode),
      ]);
      setAudit(auditRes);
      setEvents(evRes.events);
      setDisputes(dispRes.disputes);
      setOpenDisputeId(
        dispRes.disputes.find((d) => d.status === 'open' || d.status === 'in_review')?.id ?? null,
      );
      setJobs(notifRes.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [bookingCode]);

  useEffect(() => {
    setTab('overview');
    void load();
  }, [bookingCode, load]);

  async function handleResolve(
    disputeId: string,
    resolution: 'client_supported' | 'master_supported' | 'neutral' | 'rejected',
  ) {
    if (!bookingCode || resolveNote.trim().length < 5) return;
    setResolveBusy(true);
    try {
      await resolvePlatformBookingDispute(bookingCode, disputeId, {
        resolution,
        adminNote: resolveNote.trim(),
      });
      setResolveNote('');
      afterBookingMutation();
      await load();
      onResolved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось закрыть спор');
    } finally {
      setResolveBusy(false);
    }
  }

  if (!bookingCode) {
    return <p className="text-[13px] text-[#9CA3AF]">Код записи (SL-…) не найден — аудит недоступен.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              tab === t.id
                ? 'rounded-full bg-[#ff5f7a] px-3 py-1.5 text-[12px] font-semibold text-white'
                : 'rounded-full border border-[#e5e7eb] px-3 py-1.5 text-[12px] font-semibold text-[#374151]'
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button type="button" className={paGhostBtn + ' ml-auto text-[12px]'} onClick={() => void load()}>
          Обновить
        </button>
      </div>

      {loading ? <PlatformAdminLoading rows={3} /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

      {!loading && tab === 'overview' && audit ? (
        <dl className="space-y-2 text-[14px]">
          <div>
            <dt className="text-[#9CA3AF]">Статус</dt>
            <dd className="mt-1">
              <StatusBadge status={audit.status} />
            </dd>
          </div>
          {audit.clientSignal?.kind ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2">
              <dt className="text-[12px] font-bold text-amber-900">Сигнал клиента</dt>
              <dd className="text-[14px] text-amber-950">
                {audit.clientSignal.kind === 'on_the_way' && 'Клиент в пути'}
                {audit.clientSignal.kind === 'running_late' &&
                  `Опаздывает на ${audit.clientSignal.lateMinutes ?? '?'} мин`}
                {audit.clientSignal.kind === 'reported_arrived' && 'Клиент на месте'}
                {audit.clientSignal.comment ? ` — ${audit.clientSignal.comment}` : ''}
              </dd>
            </div>
          ) : null}
          {audit.cancelReason ? (
            <div>
              <dt className="text-[#9CA3AF]">Причина отмены</dt>
              <dd>{audit.cancelReason}</dd>
            </div>
          ) : null}
          {audit.noShowAt ? (
            <div>
              <dt className="text-[#9CA3AF]">Неявка</dt>
              <dd>{formatWhen(audit.noShowAt)}</dd>
            </div>
          ) : null}
          {audit.autoCompletedAt ? (
            <div>
              <dt className="text-[#9CA3AF]">Автозавершение</dt>
              <dd>{formatWhen(audit.autoCompletedAt)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {!loading && tab === 'events' ? (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {events.length === 0 ? (
            <li className="text-[13px] text-[#9CA3AF]">Событий пока нет</li>
          ) : (
            events.map((ev) => (
              <li key={ev.id} className="rounded-xl bg-[#f6f7fb] px-3 py-2 text-[13px]">
                <span className="font-semibold text-[#111827]">{ev.label}</span>
                <span className="text-[#9CA3AF]"> · {formatWhen(ev.createdAt)}</span>
                {ev.comment ? <p className="mt-1 text-[#6B7280]">{ev.comment}</p> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {!loading && tab === 'disputes' ? (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF]">Жалоб нет</p>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#eef0f5] p-3 text-[13px]">
                <p className="font-bold text-[#111827]">
                  {d.reason} · {d.status}
                </p>
                <p className="mt-1 text-[#6B7280]">{d.comment ?? '—'}</p>
                <p className="mt-1 text-[#9CA3AF]">
                  {d.createdByRole} · {formatWhen(d.createdAt)}
                </p>
                {d.resolution ? (
                  <p className="mt-2 text-[#374151]">
                    Решение: {d.resolution}
                    {d.adminNote ? ` — ${d.adminNote}` : ''}
                  </p>
                ) : null}
              </div>
            ))
          )}
          {openDisputeId ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
              <p className="text-[13px] font-bold text-rose-900">Закрыть открытый спор</p>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                rows={3}
                placeholder="Комментарий администратора (мин. 5 символов)"
                className="mt-2 w-full rounded-lg border border-rose-200 px-3 py-2 text-[14px]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {RESOLUTION_BUTTONS.map((b) => (
                  <button
                    key={b.resolution}
                    type="button"
                    disabled={resolveBusy || resolveNote.trim().length < 5}
                    className="rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] shadow-sm disabled:opacity-50"
                    onClick={() => void handleResolve(openDisputeId, b.resolution)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === 'notifications' ? (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {jobs.length === 0 ? (
            <li className="text-[13px] text-[#9CA3AF]">Задач уведомлений нет</li>
          ) : (
            jobs.map((j) => (
              <li key={j.id} className="rounded-xl bg-[#f6f7fb] px-3 py-2 text-[13px]">
                <span className="font-semibold">
                  {j.jobType} · {j.channel} · {j.status}
                </span>
                <span className="text-[#9CA3AF]"> · {formatWhen(j.scheduledAt)}</span>
                {j.providerMessageId ? (
                  <p className="mt-1 font-mono text-[11px] text-[#6B7280]">id: {j.providerMessageId}</p>
                ) : null}
                {j.lastError ? <p className="mt-1 text-rose-700">{j.lastError}</p> : null}
                <p className="text-[#9CA3AF]">попыток: {j.attempts}</p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
