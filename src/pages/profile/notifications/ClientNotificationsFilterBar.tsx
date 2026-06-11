import {
  notifFilterBadgeActive,
  notifFilterBadgeIdle,
  notifFilterChip,
  notifFilterChipActive,
  notifFilterChipIdle,
  notifFilterScroll,
  notifListToolbar,
} from '../../admin/notifications/adminNotificationsTheme';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import {
  countClientNotificationsByFilter,
  type ClientNotificationFilter,
} from './clientNotificationModel';

export type { ClientNotificationFilter };

type FilterChip = {
  id: ClientNotificationFilter;
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
  filter: ClientNotificationFilter;
  onFilter: (filter: ClientNotificationFilter) => void;
  notifications: MeNotificationRow[];
};

export function ClientNotificationsFilterBar({ filter, onFilter, notifications }: Props) {
  return (
    <div className={notifListToolbar}>
      <div className={notifFilterScroll} role="tablist" aria-label="Фильтр уведомлений">
        {FILTER_CHIPS.map((chip) => {
          const active = filter === chip.id;
          const count = chip.showCount ? countClientNotificationsByFilter(notifications, chip.id) : 0;
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
