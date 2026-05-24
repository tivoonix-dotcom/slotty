import { notifChip, notifChipActive, notifChipIdle, notifTrayLabel } from './adminNotificationsTheme';

export type NotificationsFilter = 'all' | 'unread';

type Props = {
  filter: NotificationsFilter;
  onFilter: (filter: NotificationsFilter) => void;
  unreadCount: number;
  totalCount: number;
};

export function NotificationsFilterBar({ filter, onFilter, unreadCount, totalCount }: Props) {
  const chips: Array<{ id: NotificationsFilter; label: string; count?: number }> = [
    { id: 'all', label: 'Все', count: totalCount },
    { id: 'unread', label: 'Новые', count: unreadCount },
  ];

  return (
    <div>
      <p className={notifTrayLabel}>Лента</p>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFilter(chip.id)}
              className={`${notifChip} gap-2 ${active ? notifChipActive : notifChipIdle}`}
            >
              {chip.label}
              {chip.count != null && chip.count > 0 ? (
                <span
                  className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
                    active ? 'bg-[#ff5f7a] text-white' : 'bg-[#EAECEF] text-[#6B7280]'
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
