import { useCallback, useEffect, useState } from 'react';
import { BOOKING_CLIENT_REPORT_REASONS } from '../../../features/appointments/api/bookingClientReportApi';
import { getClientReports, updateClientReportStatus } from '../api/platformAdminApi';
import type { ClientReportAdmin } from '../api/platformAdmin.types';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
  SponsorStatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

type StatusFilter = 'all' | 'pending' | 'in_review' | 'closed' | 'rejected';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'Новые' },
  { id: 'in_review', label: 'В работе' },
  { id: 'all', label: 'Все' },
  { id: 'closed', label: 'Закрыты' },
  { id: 'rejected', label: 'Отклонены' },
];

function reasonLabel(code: string): string {
  return BOOKING_CLIENT_REPORT_REASONS.find((r) => r.code === code)?.label ?? code;
}

export function PlatformAdminClientReportsTab() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<ClientReportAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [closeComment, setCloseComment] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getClientReports(filter, { offset });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.reports] : res.reports));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    void load(0);
  }, [load]);

  async function setStatus(id: string, status: 'in_review' | 'closed' | 'rejected', comment?: string) {
    setBusyId(id);
    try {
      await updateClientReportStatus(id, status, comment);
      setRejectId(null);
      setRejectComment('');
      setCloseId(null);
      setCloseComment('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PlatformAdminToolbar
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Статус жалобы',
            chips: FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              active: filter === f.id,
              onClick: () => setFilter(f.id),
            })),
          },
        ]}
      />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}

      {!loading && !error && items.length === 0 ? (
        <PlatformAdminEmpty
          title={filter === 'pending' ? 'Новых жалоб нет' : 'Жалоб не найдено'}
          text={
            filter === 'pending'
              ? 'Когда мастер пожалуется на клиента после визита, жалоба появится здесь.'
              : 'Попробуйте другой фильтр.'
          }
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {items.map((req) => (
            <PlatformAdminCard key={req.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">
                    {req.clientName ?? 'Клиент без имени'}
                  </h3>
                  <p className="mt-0.5 text-[14px] font-semibold text-[#374151]">{reasonLabel(req.reasonCode)}</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Мастер: {req.masterName}</p>
                  {req.voucherNumber ? (
                    <p className="mt-1 text-[13px] font-semibold text-[#111827]">Запись: {req.voucherNumber}</p>
                  ) : null}
                </div>
                <SponsorStatusBadge status={req.status} />
              </div>

              {req.reasonText ? (
                <div className="rounded-2xl bg-[#FFF1F4]/60 px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Комментарий</p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#374151]">
                    {req.reasonText}
                  </p>
                </div>
              ) : null}

              {req.adminComment ? (
                <div className="rounded-2xl border border-[#EAECEF] bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Комментарий админа</p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#374151]">
                    {req.adminComment}
                  </p>
                </div>
              ) : null}

              {(req.status === 'pending' || req.status === 'in_review') && (
                <div className="flex flex-wrap gap-2">
                  {req.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      className={paGhostBtn}
                      onClick={() => void setStatus(req.id, 'in_review')}
                    >
                      В работу
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paPrimaryBtn}
                    onClick={() => {
                      setCloseId(req.id);
                      setCloseComment('');
                    }}
                  >
                    Закрыть
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paGhostBtn}
                    onClick={() => {
                      setRejectId(req.id);
                      setRejectComment('');
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </PlatformAdminCard>
          ))}

          <PlatformAdminLoadMore
            loadedCount={items.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(items.length)}
          />
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(closeId)}
        title="Закрыть жалобу"
        description="Комментарий сохранится в админке."
        confirmLabel="Закрыть"
        busy={Boolean(busyId)}
        onClose={() => {
          setCloseId(null);
          setCloseComment('');
        }}
        onConfirm={() => {
          if (closeId) void setStatus(closeId, 'closed', closeComment.trim());
        }}
        confirmDisabled={closeComment.trim().length < 5}
      >
        <label className="block text-left text-[13px] font-medium text-[#6B7280]">
          Комментарий админа *
          <textarea
            className={`${paInput} mt-2 min-h-[120px] w-full resize-y`}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder="Что сделали по жалобе…"
            maxLength={2000}
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(rejectId)}
        title="Отклонить жалобу"
        description="Комментарий сохранится в админке."
        confirmLabel="Отклонить"
        danger
        busy={Boolean(busyId)}
        onClose={() => {
          setRejectId(null);
          setRejectComment('');
        }}
        onConfirm={() => {
          if (rejectId) void setStatus(rejectId, 'rejected', rejectComment.trim());
        }}
        confirmDisabled={rejectComment.trim().length < 5}
      >
        <label className="block text-left text-[13px] font-medium text-[#6B7280]">
          Причина отклонения *
          <textarea
            className={`${paInput} mt-2 min-h-[100px] w-full resize-y`}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            maxLength={2000}
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
