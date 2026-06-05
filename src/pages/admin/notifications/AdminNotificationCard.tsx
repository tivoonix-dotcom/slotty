import { useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { resolveMasterNotificationAction } from './notificationAction';
import {
  notifBadgeNew,
  notifCardActionBtn,
  notifCardActionBtnAttention,
  notifCardActionBtnRead,
  notifCardMetaChip,
  notifCardShellAction,
  notifCardShellInteractive,
  notifCardShellRead,
  notifCardShellUnread,
  notifIconFallback,
  notifMetaAccent,
  notifUnreadDot,
} from './adminNotificationsTheme';
import { buildMasterNotificationCardModel } from './masterNotificationModel';

type Props = {
  item: MeNotificationRow;
  index?: number;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
};

function MetaChips({
  card,
  isUnread,
}: {
  card: ReturnType<typeof buildMasterNotificationCardModel>;
  isUnread: boolean;
}) {
  const chipMuted = isUnread ? '' : 'bg-[#FAFAFA] text-[#9CA3AF]';

  return (
    <>
      {card.clientName ? (
        <span className={`${notifCardMetaChip} ${chipMuted}`}>{card.clientName}</span>
      ) : null}
      {card.serviceName ? (
        <span className={`${notifCardMetaChip} ${chipMuted}`}>{card.serviceName}</span>
      ) : null}
      {card.whenLabel ? (
        <time className={`${notifCardMetaChip} ${isUnread ? notifMetaAccent : chipMuted}`}>
          {card.whenLabel}
        </time>
      ) : null}
    </>
  );
}

export function AdminNotificationCard({ item, index = 0, onOpen, onMarkRead }: Props) {
  const navigate = useNavigate();
  const action = useMemo(() => resolveMasterNotificationAction(item), [item]);
  const card = useMemo(() => buildMasterNotificationCardModel(item), [item]);
  const Icon = card.visual.icon;
  const isUnread = card.isUnread;

  const shellClass = [
    notifCardShellInteractive,
    isUnread ? notifCardShellUnread : notifCardShellRead,
    card.requiresAction && isUnread ? notifCardShellAction : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stickerClass = isUnread
    ? card.visual.stickerClass
    : 'bg-white text-[#9CA3AF] ring-1 ring-[#EEEEEE]';

  const actionBtnClass = card.requiresAction
    ? notifCardActionBtnAttention
    : isUnread
      ? notifCardActionBtn
      : notifCardActionBtnRead;

  const openAction = (e: MouseEvent) => {
    e.stopPropagation();
    if (!item.read_at) onMarkRead?.(item.id);
    onOpen(item);
  };

  const navigateAction = (e: MouseEvent) => {
    e.stopPropagation();
    if (!action) return;
    if (!item.read_at) onMarkRead?.(item.id);
    navigate(action.to);
  };

  const onAction = action ? navigateAction : openAction;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={shellClass}
      style={{ animationDelay: `${index * 40}ms` }}
      aria-label={isUnread ? `${card.title}, непрочитано` : `${card.title}, прочитано`}
    >
      {/* Mobile */}
      <div className="p-3.5 lg:hidden">
        <div className="flex items-start gap-3">
          <span className={`${notifIconFallback} h-10 w-10 shrink-0 ${stickerClass}`} aria-hidden>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isUnread ? <span className={notifUnreadDot} aria-hidden /> : null}
                <p
                  className={`min-w-0 leading-snug ${
                    isUnread
                      ? 'text-[15px] font-bold text-[#111827]'
                      : 'text-[15px] font-semibold text-[#6B7280]'
                  }`}
                >
                  {card.title}
                </p>
              </div>
              <time
                className={`shrink-0 text-[11px] tabular-nums ${
                  isUnread ? `font-semibold ${notifMetaAccent}` : 'font-medium text-[#C4C9D4]'
                }`}
              >
                {card.createdAtLabel}
              </time>
            </div>

            {card.statusBadge && isUnread ? (
              <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${card.statusBadge.className}`}>
                {card.statusBadge.label}
              </span>
            ) : null}

            <p
              className={`mt-1.5 line-clamp-2 text-[13px] leading-snug ${
                isUnread ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
              }`}
            >
              {card.description}
            </p>

            {(card.clientName || card.serviceName || card.whenLabel) ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <MetaChips card={card} isUnread={isUnread} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F3F4F6] pt-3">
          {isUnread ? (
            <span className={notifBadgeNew}>Новое</span>
          ) : (
            <span className="text-[11px] font-medium text-[#C4C9D4]">Просмотрено</span>
          )}
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex items-center gap-0.5 text-[13px] ${
              isUnread ? 'font-bold text-[#F47C8C]' : 'font-semibold text-[#6B7280]'
            }`}
          >
            {card.listActionLabel}
            <HiChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden min-w-0 flex-1 lg:flex">
        <div
          className={`flex w-[4.75rem] shrink-0 items-center justify-center self-stretch py-3 ${
            isUnread ? 'bg-[#FFF1F4]' : 'bg-[#EBEBEB]'
          }`}
        >
          <span className={`${notifIconFallback} h-11 w-11 ${stickerClass}`} aria-hidden>
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {isUnread ? <span className={`${notifUnreadDot} mt-2`} aria-hidden /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    <p
                      className={`min-w-0 leading-snug ${
                        isUnread
                          ? 'text-[16px] font-bold text-[#111827]'
                          : 'text-[16px] font-semibold text-[#6B7280]'
                      }`}
                    >
                      {card.title}
                    </p>
                    {card.statusBadge ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isUnread ? card.statusBadge.className : 'bg-[#F5F5F5] text-[#9CA3AF]'
                        }`}
                      >
                        {card.statusBadge.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isUnread ? (
                      <span className={notifBadgeNew}>Новое</span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#9CA3AF]">
                        Прочитано
                      </span>
                    )}
                    <time
                      className={`text-[11px] tabular-nums ${
                        isUnread ? `font-semibold ${notifMetaAccent}` : 'font-medium text-[#C4C9D4]'
                      }`}
                    >
                      {card.createdAtLabel}
                    </time>
                  </div>
                </div>
                <p
                  className={`mt-1 line-clamp-2 text-[13px] leading-snug ${
                    isUnread ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {card.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <MetaChips card={card} isUnread={isUnread} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end justify-end self-stretch py-0.5">
            <button type="button" onClick={onAction} className={actionBtnClass}>
              {card.listActionLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
