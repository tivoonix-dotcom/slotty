import {
  notifFilterBadgeActive,
  notifFilterBadgeIdle,
  notifFilterChip,
  notifFilterChipActive,
  notifFilterChipIdle,
  notifFilterScroll,
  notifListToolbar,
} from './adminNotificationsTheme';
import {
  countByFilter,
  type MasterNotificationFilter,
} from './masterNotificationModel';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';

export type NotificationsFilter = MasterNotificationFilter;

type FilterChip = {
  id: MasterNotificationFilter;
  label: string;
  showCount?: boolean;
};

const FILTER_CHIPS: FilterChip[] = [
  { id: 'all', label: 'Все', showCount: true },
  { id: 'action_required', label: 'Действия', showCount: true },
  { id: 'appointments', label: 'Записи', showCount: true },
  { id: 'reminders', label: 'Напоминания', showCount: true },
  { id: 'reviews', label: 'Отзывы', showCount: true },
  { id: 'cancellations', label: 'Отмены', showCount: true },
  { id: 'system', label: 'Системные', showCount: true },
];

type Props = {
  filter: NotificationsFilter;
  onFilter: (filter: NotificationsFilter) => void;
  notifications: MeNotificationRow[];
};

export function NotificationsFilterBar({ filter, onFilter, notifications }: Props) {
  return (
    <div className={notifListToolbar}>
      <div className={notifFilterScroll} role="tablist" aria-label="Фильтр уведомлений">
        {FILTER_CHIPS.map((chip) => {
          const active = filter === chip.id;
          const count = chip.showCount ? countByFilter(notifications, chip.id) : 0;
          const showBadge = count > 0 && (active || chip.id === 'action_required');
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilter(chip.id)}
              className={`${notifFilterChip} ${active ? notifFilterChipActive : notifFilterChipIdle}`}
            >
              <span>{chip.label}</span>
              {showBadge ? (
                <span className={active ? notifFilterBadgeActive : notifFilterBadgeIdle}>
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
