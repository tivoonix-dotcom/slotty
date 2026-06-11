import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { notifListGap, notifTimeGroupLabel } from '../../admin/notifications/adminNotificationsTheme';
import { ClientNotificationCard } from './ClientNotificationCard';
import type { ClientNotificationTimeGroup } from './clientNotificationModel';

type Props = {
  group: ClientNotificationTimeGroup;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
  startIndex?: number;
};

export function ClientNotificationsTimeGroup({ group, onOpen, onMarkRead, startIndex = 0 }: Props) {
  return (
    <section>
      <h2 className={notifTimeGroupLabel}>{group.label}</h2>
      <ul className={`mt-2 ${notifListGap}`}>
        {group.items.map((item, index) => (
          <li key={item.id}>
            <ClientNotificationCard
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
