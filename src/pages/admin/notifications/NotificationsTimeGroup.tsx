import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { notifTimeGroupLabel } from './adminNotificationsTheme';
import { AdminNotificationCard } from './AdminNotificationCard';
import type { MasterNotificationTimeGroup } from './masterNotificationModel';

type Props = {
  group: MasterNotificationTimeGroup;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
  startIndex?: number;
};

export function NotificationsTimeGroup({ group, onOpen, onMarkRead, startIndex = 0 }: Props) {
  return (
    <section className="space-y-2.5 lg:space-y-3">
      <h2 className={notifTimeGroupLabel}>{group.label}</h2>
      <ul className="flex flex-col gap-2.5 lg:gap-3">
        {group.items.map((item, index) => (
          <li key={item.id}>
            <AdminNotificationCard
              item={item}
              index={startIndex + index}
              onOpen={onOpen}
              onMarkRead={onMarkRead}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
