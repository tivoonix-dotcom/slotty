import { useMemo, type MouseEvent } from 'react';
import { HiChevronRight } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { apptCardDetailLink } from '../appointments/adminAppointmentsTheme';
import {
  notifCardShellAction,
  notifCardShellInteractive,
  notifCardShellRead,
  notifCardShellUnread,
  notifIconFallback,
} from './adminNotificationsTheme';
import { buildMasterNotificationCardModel } from './masterNotificationModel';

type Props = {
  item: MeNotificationRow;
  index?: number;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
};

function compactListSubtitle(
  card: ReturnType<typeof buildMasterNotificationCardModel>,
): string | null {
  const parts = [card.serviceName, card.whenLabel].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (card.clientName) return card.clientName;
  const text = card.description.trim();
  return text || null;
}

export function AdminNotificationCard({ item, index = 0, onOpen, onMarkRead }: Props) {
  const card = useMemo(() => buildMasterNotificationCardModel(item), [item]);
  const Icon = card.visual.icon;
  const isUnread = card.isUnread;
  const subtitle = useMemo(() => compactListSubtitle(card), [card]);

  const shellClass = [
    notifCardShellInteractive,
    isUnread ? notifCardShellUnread : notifCardShellRead,
    card.requiresAction && isUnread ? notifCardShellAction : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stickerClass = isUnread ? card.visual.stickerClass : card.visual.stickerClassRead;
  const stripClass = isUnread ? card.visual.stripClass : 'bg-[#EBEBEB]';

  const showActionBadge =
    card.requiresAction && !isUnread && card.statusBadge?.id === 'action_required';

  const openCard = () => {
    if (!item.read_at) onMarkRead?.(item.id);
    onOpen(item);
  };

  const onActionClick = (e: MouseEvent) => {
    e.stopPropagation();
    openCard();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openCard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCard();
        }
      }}
      className={shellClass}
      style={{ animationDelay: `${index * 40}ms` }}
      aria-label={isUnread ? `${card.title}, непрочитано` : `${card.title}, прочитано`}
    >
      <div className="flex min-w-0 flex-1">
        <div
          className={`flex w-[4rem] shrink-0 items-center justify-center self-stretch py-3 sm:w-[4.75rem] ${stripClass}`}
        >
          <span className={`${notifIconFallback} h-10 w-10 sm:h-11 sm:w-11 ${stickerClass}`} aria-hidden>
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`min-w-0 line-clamp-2 leading-snug sm:line-clamp-1 ${
                  isUnread
                    ? 'text-[15px] font-bold text-[#111827] sm:text-[16px]'
                    : 'text-[15px] font-semibold text-[#6B7280] sm:text-[16px]'
                }`}
              >
                {card.title}
              </p>
              <time className="shrink-0 text-[11px] font-medium tabular-nums text-[#9CA3AF]">
                {card.createdAtLabel}
              </time>
            </div>

            {showActionBadge ? (
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${card.statusBadge?.className ?? ''}`}
              >
                {card.statusBadge?.label}
              </span>
            ) : null}

            {subtitle ? (
              <p
                className={`mt-1 line-clamp-1 text-[13px] leading-snug ${
                  isUnread ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                }`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onActionClick}
            className={`${apptCardDetailLink} shrink-0 self-end pb-0.5`}
            aria-label={card.listActionLabel}
          >
            <HiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
