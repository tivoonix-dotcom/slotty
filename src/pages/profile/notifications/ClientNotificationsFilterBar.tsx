import { catalogSectionTabActive, catalogSectionTabIdle } from '../clientProfile/clientProfileTheme';
import {
  clientNotificationsToolbar,
  clientNotificationsTrayLabel,
} from './clientNotificationsTheme';

export type ClientNotificationsFilter = 'all' | 'unread';

type Props = {
  filter: ClientNotificationsFilter;
  onFilter: (filter: ClientNotificationsFilter) => void;
  unreadCount: number;
  totalCount: number;
  onMarkAllRead?: () => void;
};

export function ClientNotificationsFilterBar({
  filter,
  onFilter,
  unreadCount,
  totalCount,
  onMarkAllRead,
}: Props) {
  const chips: Array<{ id: ClientNotificationsFilter; label: string; count?: number }> = [
    { id: 'all', label: 'Все', count: totalCount },
    { id: 'unread', label: 'Новые', count: unreadCount },
  ];

  return (
    <div className={clientNotificationsToolbar}>
      <div className="flex items-center justify-between gap-3">
        <p className={clientNotificationsTrayLabel}>Лента</p>
        {onMarkAllRead ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="shrink-0 text-[13px] font-semibold text-[#F47C8C] transition hover:opacity-80 active:scale-[0.98]"
          >
            Прочитать все
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#EBEBEB] p-1"
        role="tablist"
        aria-label="Фильтр уведомлений"
      >
        {chips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilter(chip.id)}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-[8px] px-3 text-[13px] transition ${
                active ? catalogSectionTabActive : catalogSectionTabIdle
              }`}
            >
              <span>{chip.label}</span>
              {chip.count != null && chip.count > 0 ? (
                <span
                  className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#F5F5F5] text-[#6B7280]'
                  }`}
                >
                  {chip.count > 99 ? '99+' : chip.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
