import { useCallback, useEffect, useState } from 'react';
import {
  approveAccountDeletionRequest,
  getAccountDeletionRequests,
  rejectAccountDeletionRequest,
} from '../api/platformAdminApi';
import type { AccountDeletionRequestAdmin } from '../api/platformAdmin.types';
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
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'Ожидают' },
  { id: 'approved', label: 'Удалены' },
  { id: 'rejected', label: 'Отклонены' },
  { id: 'cancelled', label: 'Отменены' },
  { id: 'all', label: 'Все' },
];

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminAccountDeletionTab() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<AccountDeletionRequestAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveNote, setApproveNote] = useState('');

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getAccountDeletionRequests(filter, { offset });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.requests] : res.requests));
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

  async function runApprove() {
    if (!approveId) return;
    setBusyId(approveId);
    try {
      await approveAccountDeletionRequest(approveId, approveNote.trim() || null);
      setApproveId(null);
      setApproveNote('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  async function runReject() {
    if (!rejectId) return;
    setBusyId(rejectId);
    try {
      await rejectAccountDeletionRequest(rejectId, rejectNote.trim() || null);
      setRejectId(null);
      setRejectNote('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  const approveTarget = approveId ? items.find((r) => r.id === approveId) : null;
  const rejectTarget = rejectId ? items.find((r) => r.id === rejectId) : null;

  return (
    <div>
      <PlatformAdminToolbar
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Статус',
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
          title={filter === 'pending' ? 'Нет запросов на удаление' : 'Запросов не найдено'}
          text={
            filter === 'pending'
              ? 'Когда мастер отправит запрос из «Конфиденциальность → Опасная зона», он появится здесь.'
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
                    {req.masterDisplayName ?? req.userFullName}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[#6B7280]">
                    {req.userFullName} · {req.userRole}
                    {req.userEmail ? ` · ${req.userEmail}` : ''}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">{req.userId}</p>
                </div>
                <StatusBadge
                  status={req.status === 'approved' ? 'deleted' : req.status}
                />
              </div>

              <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3 text-[14px] text-[#374151]">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Запрошено {formatWhen(req.requestedAt)}
                </p>
                {req.message.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap">{req.message}</p>
                ) : (
                  <p className="mt-2 text-[#9CA3AF]">Без комментария</p>
                )}
              </div>

              {req.adminNote ? (
                <p className="text-[13px] text-[#6B7280]">
                  <span className="font-semibold">Комментарий админа:</span> {req.adminNote}
                </p>
              ) : null}

              {req.status === 'pending' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={paPrimaryBtn}
                    disabled={busyId === req.id}
                    onClick={() => {
                      setApproveId(req.id);
                      setApproveNote('');
                    }}
                  >
                    Подтвердить удаление
                  </button>
                  <button
                    type="button"
                    className={paGhostBtn}
                    disabled={busyId === req.id}
                    onClick={() => {
                      setRejectId(req.id);
                      setRejectNote('');
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              ) : null}
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
        open={Boolean(approveId)}
        danger
        busy={Boolean(busyId)}
        title="Подтвердить удаление аккаунта?"
        description={
          approveTarget
            ? `Аккаунт «${approveTarget.userFullName}» будет помечен как удалён, профиль скрыт из каталога, сеансы завершены. Действие необратимо.`
            : undefined
        }
        confirmLabel="Удалить аккаунт"
        onClose={() => {
          if (busyId) return;
          setApproveId(null);
        }}
        onConfirm={() => void runApprove()}
      >
        <label className="block text-left text-[13px] font-semibold text-[#6B7280]">
          Комментарий (необязательно)
          <textarea
            className={`${paInput} mt-1.5 min-h-[80px] w-full resize-y`}
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            maxLength={2000}
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(rejectId)}
        busy={Boolean(busyId)}
        title="Отклонить запрос?"
        description={
          rejectTarget
            ? `Пользователь «${rejectTarget.userFullName}» останется активным. Укажите причину — она уйдёт в уведомление.`
            : undefined
        }
        confirmLabel="Отклонить"
        onClose={() => {
          if (busyId) return;
          setRejectId(null);
        }}
        onConfirm={() => void runReject()}
      >
        <label className="block text-left text-[13px] font-semibold text-[#6B7280]">
          Причина (рекомендуется)
          <textarea
            className={`${paInput} mt-1.5 min-h-[80px] w-full resize-y`}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            maxLength={2000}
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
