import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORM_ADMIN_BILLING_PATH } from '../../../app/paths';
import {
  getBillingDiagnostics,
  getPlatformSubscriptionDetail,
  listPlatformSubscriptions,
  postPlatformSubscriptionCancel,
  postPlatformSubscriptionExpire,
  postPlatformSubscriptionRetry,
  type PlatformSubscriptionDetail,
  type PlatformSubscriptionRow,
} from '../api/platformAdminApi';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paCard, paFilterChip, paGhostBtn } from '../platformAdminTheme';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Active' },
  { id: 'canceled_at_period_end', label: 'Отмена в конце' },
  { id: 'past_due', label: 'Past due' },
  { id: 'expired', label: 'Expired' },
  { id: 'free', label: 'Free' },
  { id: 'next_charge', label: 'Скоро списание' },
  { id: 'failed_pay', label: 'Ошибки оплаты' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

function formatDt(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function PlatformAdminSubscriptionsTab() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [rows, setRows] = useState<PlatformSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlatformSubscriptionDetail | null>(null);
  const [diag, setDiag] = useState<Awaited<ReturnType<typeof getBillingDiagnostics>> | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: Parameters<typeof listPlatformSubscriptions>[0] = { page: 1, pageSize: 50 };
      if (filter === 'active') q.status = 'active';
      if (filter === 'canceled_at_period_end') q.cancelAtPeriodEnd = true;
      if (filter === 'past_due') q.pastDue = true;
      if (filter === 'expired') q.status = 'expired';
      if (filter === 'free') q.planCode = 'free';
      if (filter === 'next_charge') q.nextChargeSoon = true;
      if (filter === 'failed_pay') q.hasFailedPayments = true;
      const data = await listPlatformSubscriptions(q);
      setRows(data.subscriptions);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadList();
    void getBillingDiagnostics().then(setDiag).catch(() => setDiag(null));
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void getPlatformSubscriptionDetail(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  async function runAdmin(action: 'cancel' | 'expire' | 'retry') {
    if (!selectedId) return;
    setBusy(true);
    try {
      if (action === 'cancel') {
        const reason = window.prompt('Причина отмены (audit)') ?? '';
        if (reason.length < 3) return;
        await postPlatformSubscriptionCancel(selectedId, reason);
      } else if (action === 'expire') {
        const reason = window.prompt('Причина expire (audit)') ?? '';
        if (reason.length < 3) return;
        await postPlatformSubscriptionExpire(selectedId, reason);
      } else {
        await postPlatformSubscriptionRetry(selectedId);
      }
      await loadList();
      const d = await getPlatformSubscriptionDetail(selectedId);
      setDetail(d);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PlatformAdminPageIntro />
      <p className="mb-4 text-[14px]">
        <Link to={PLATFORM_ADMIN_BILLING_PATH} className="font-semibold text-[#ff5f7a] hover:underline">
          ← Биллинг
        </Link>
      </p>

      {diag ? (
        <div className={`${paCard} mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
          <div>
            <p className="text-[12px] text-[#6B7280]">Worker</p>
            <p className="font-semibold text-[#111827]">
              {diag.worker.enabled ? (diag.worker.running ? 'работает' : 'выкл') : 'disabled'}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">tick: {diag.worker.lastTickAt ?? '—'}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#6B7280]">Recurring MIT</p>
            <p className="font-semibold">{diag.recurringEnabled ? 'включён' : 'выкл'}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#6B7280]">Jobs pending</p>
            <p className="font-semibold">{diag.jobs.pendingJobs}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#6B7280]">Past due</p>
            <p className="font-semibold">{diag.jobs.pastDueCount}</p>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={paFilterChip(filter === f.id)}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={paCard}>
          <h3 className="mb-3 text-[16px] font-bold">Подписки ({total})</h3>
          {loading ? <p className="text-[14px] text-[#6B7280]">Загрузка…</p> : null}
          {error ? <p className="text-[14px] text-red-600">{error}</p> : null}
          <ul className="divide-y divide-[#F3F4F6]">
            {rows.map((r) => (
              <li key={r.masterId}>
                <button
                  type="button"
                  className={`w-full py-3 text-left ${selectedId === r.masterId ? 'bg-[#FFF8F9]' : ''}`}
                  onClick={() => setSelectedId(r.masterId)}
                >
                  <p className="font-semibold text-[#111827]">{r.masterName ?? r.masterId.slice(0, 8)}</p>
                  <p className="text-[13px] text-[#6B7280]">
                    {r.planCode} · {r.status}
                    {r.cardLast4 ? ` · •••• ${r.cardLast4}` : ''}
                  </p>
                  <p className="text-[12px] text-[#9CA3AF]">
                    до {formatDt(r.currentPeriodEnd)} · next {formatDt(r.nextChargeAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={paCard}>
          {!detail ? (
            <p className="text-[14px] text-[#6B7280]">Выберите подписку</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[16px] font-bold">Детали</h3>
              <dl className="space-y-1 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Мастер</dt>
                  <dd>{detail.subscription.masterName ?? detail.subscription.masterId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Статус</dt>
                  <dd>{detail.subscription.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Период</dt>
                  <dd>
                    {formatDt(detail.subscription.currentPeriodStart)} —{' '}
                    {formatDt(detail.subscription.currentPeriodEnd)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">След. списание</dt>
                  <dd>{formatDt(detail.subscription.nextChargeAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Карта</dt>
                  <dd>
                    {detail.subscription.cardBrand ?? '—'} •••• {detail.subscription.cardLast4 ?? '—'}
                    {detail.subscription.hasCardToken ? ' · token ✓' : ''}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} className={paGhostBtn} onClick={() => void runAdmin('retry')}>
                  Retry payment
                </button>
                <button type="button" disabled={busy} className={paGhostBtn} onClick={() => void runAdmin('cancel')}>
                  Cancel sub
                </button>
                <button type="button" disabled={busy} className={paGhostBtn} onClick={() => void runAdmin('expire')}>
                  Mark expired
                </button>
              </div>

              <div>
                <h4 className="mb-2 text-[14px] font-semibold">Платежи</h4>
                <ul className="max-h-40 overflow-auto text-[13px]">
                  {detail.payments.map((p) => (
                    <li key={p.id} className="border-b border-[#F3F4F6] py-1">
                      {formatDt(p.paidAt ?? p.createdAt)} · {p.amount} {p.currency} · {p.status}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-[14px] font-semibold">Billing jobs</h4>
                <ul className="max-h-32 overflow-auto text-[13px]">
                  {detail.jobs.map((j) => (
                    <li key={j.id} className="border-b border-[#F3F4F6] py-1">
                      {j.jobType} · {j.status} · {j.lastError ?? 'ok'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
