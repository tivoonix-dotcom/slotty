import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EMPTY_DATE } from '../../../shared/lib/emptyDisplayText';
import { getNewsletterSubscribers } from '../api/platformAdminApi';
import type { NewsletterSubscriberAdmin } from '../api/platformAdmin.types';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paFilterChip, paGhostBtn, paInput } from '../platformAdminTheme';

type StatusFilter = 'all' | 'subscribed' | 'unsubscribed';

const STATUS_LABELS: Record<string, string> = {
  subscribed: 'Активна',
  unsubscribed: 'Отписан',
};

function formatDate(iso: string | null): string {
  if (!iso) return EMPTY_DATE;
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminNewsletterSubscribersTab() {
  const [, setParams] = useSearchParams();
  const [items, setItems] = useState<NewsletterSubscriberAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('subscribed');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [offset, setOffset] = useState(0);

  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNewsletterSubscribers({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
        limit,
        offset,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [offset, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    setSearch(searchDraft.trim());
  }

  const subscribedTotalHint =
    statusFilter === 'subscribed' && !search.trim() ? total : null;

  if (loading && items.length === 0) return <PlatformAdminLoading rows={4} />;
  if (error && items.length === 0) return <PlatformAdminError message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] text-[#6B7280]">
            Подписчики из формы в футере лендинга. Отправка новостей — во вкладке{' '}
            <button
              type="button"
              className="font-medium text-[#ff5f7a] underline underline-offset-2"
              onClick={() => setParams({ tab: 'campaigns' })}
            >
              Email-рассылки
            </button>
            , аудитория «Подписчики рассылки».
          </p>
          {subscribedTotalHint != null ? (
            <p className="mt-1 text-[14px] text-[#111827]">
              Активных подписчиков: <strong>{subscribedTotalHint}</strong>
            </p>
          ) : null}
        </div>
        <button type="button" className={paGhostBtn} onClick={() => setParams({ tab: 'campaigns' })}>
          Создать рассылку
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Статус подписки">
        {(
          [
            { id: 'subscribed', label: 'Активные' },
            { id: 'unsubscribed', label: 'Отписанные' },
            { id: 'all', label: 'Все' },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === chip.id}
            className={paFilterChip(statusFilter === chip.id)}
            onClick={() => {
              setStatusFilter(chip.id);
              setOffset(0);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" onSubmit={onSearchSubmit}>
        <input
          className={`${paInput} max-w-sm`}
          type="search"
          placeholder="Поиск по email"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
        <button type="submit" className={paGhostBtn}>
          Найти
        </button>
        {search ? (
          <button
            type="button"
            className={paGhostBtn}
            onClick={() => {
              setSearchDraft('');
              setSearch('');
              setOffset(0);
            }}
          >
            Сбросить
          </button>
        ) : null}
      </form>

      {error ? <PlatformAdminCard className="p-4 text-[14px] text-red-600">{error}</PlatformAdminCard> : null}

      <PlatformAdminCard className="overflow-x-auto">
        {items.length === 0 ? (
          <PlatformAdminEmpty
            title="Подписчиков нет"
            text={
              statusFilter === 'subscribed'
                ? 'Пока никто не подписался через футер. После первой подписки email появится здесь.'
                : 'По выбранным фильтрам записей не найдено.'
            }
          />
        ) : (
          <>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#eef0f5] text-[#6B7280]">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Источник</th>
                  <th className="px-4 py-3 font-medium">Подписан</th>
                  <th className="px-4 py-3 font-medium">Отписан</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-[#eef0f5]">
                    <td className="px-4 py-3 font-medium text-[#111827]">{row.email}</td>
                    <td className="px-4 py-3">{STATUS_LABELS[row.status] ?? row.status}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{row.source}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{formatDate(row.subscribedAt)}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{formatDate(row.unsubscribedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f5] px-4 py-3">
              <p className="text-[13px] text-[#6B7280]">
                Показано {offset + 1}–{offset + items.length} из {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={paGhostBtn}
                  disabled={offset === 0 || loading}
                  onClick={() => setOffset((v) => Math.max(0, v - limit))}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className={paGhostBtn}
                  disabled={offset + items.length >= total || loading}
                  onClick={() => setOffset((v) => v + limit)}
                >
                  Дальше
                </button>
              </div>
            </div>
          </>
        )}
      </PlatformAdminCard>
    </div>
  );
}
