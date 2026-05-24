import { useCallback } from 'react';
import { HiBell } from 'react-icons/hi2';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { markNotificationReadApi } from '../../../features/profile/api/clientNotifications';
import { notificationsRowClass, notificationsRowIconClass } from './clientNotificationsTheme';

type Props = {
  item: MeNotificationRow;
  onAfterRead?: () => void;
};

export function ClientNotificationCard({ item, onAfterRead }: Props) {
  const isNew = !item.read_at;

  const onClick = useCallback(() => {
    if (item.read_at) return;
    void (async () => {
      try {
        await markNotificationReadApi(item.id);
        onAfterRead?.();
      } catch {
        /* ignore */
      }
    })();
  }, [item.id, item.read_at, onAfterRead]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${notificationsRowClass} ${isNew ? 'bg-[#FAFAFA]' : ''}`}
    >
      <span className={notificationsRowIconClass} aria-hidden>
        <HiBell className="h-[18px] w-[18px] shrink-0" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#111827]">{item.title}</p>
          <time className="shrink-0 pt-0.5 text-[12px] font-medium tabular-nums text-[#9CA3AF]">
            {formatNotificationListTime(item.created_at)}
          </time>
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{item.body}</p>
      </div>

      {isNew ? (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F47C8C]" aria-label="Непрочитано" />
      ) : null}
    </article>
  );
}
