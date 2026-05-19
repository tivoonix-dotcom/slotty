import { useCallback } from 'react';
import { markNotificationReadApi, type MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';

function notificationAccent(type: string): { bg: string; text: string } {
  switch (type) {
    case 'appointment_new':
      return { bg: 'bg-[#FFF1F4]', text: 'text-[#F47C8C]' };
    case 'appointment_cancelled':
      return { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]' };
    case 'appointment_reminder':
      return { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' };
    case 'review_request':
    case 'system':
      return { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]' };
    case 'billing':
      return { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]' };
    default:
      return { bg: 'bg-[#F1EFEF]', text: 'text-[#9CA3AF]' };
  }
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  item: MeNotificationRow;
  index?: number;
  onAfterRead?: () => void;
};

export function AdminNotificationCard({ item, index = 0, onAfterRead }: Props) {
  const isNew = !item.read_at;
  const accent = notificationAccent(item.type);

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
      className={`rounded-[22px] px-4 py-3.5 ring-1 transition active:scale-[0.99] ${
        isNew
          ? 'bg-white ring-[#F47C8C]/20 shadow-[0_10px_30px_rgba(244,124,140,0.12)]'
          : 'bg-white ring-[#F3F4F6] shadow-[0_6px_22px_rgba(17,24,39,0.04)]'
      }`}
      style={{ animationDelay: `${index * 48}ms` }}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            isNew ? `${accent.bg} ${accent.text}` : 'bg-[#F1EFEF] text-[#9CA3AF]'
          }`}
        >
          <IconBell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[16px] font-semibold leading-snug text-[#111827]">
              {item.title}
              {isNew ? (
                <span className="ml-2 inline-flex h-2 w-2 align-middle rounded-full bg-[#F47C8C]" aria-hidden />
              ) : null}
            </p>
            <time className="shrink-0 pt-0.5 text-[12px] font-medium tabular-nums text-[#9CA3AF]">
              {formatNotificationListTime(item.created_at)}
            </time>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{item.body}</p>
        </div>
      </div>
    </article>
  );
}
