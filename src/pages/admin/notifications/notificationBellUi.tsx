import { Link } from 'react-router-dom';
import { IconNavNotifications } from '../adminCabinetNav';

type BellVariant = 'mobile' | 'desktop';

export function NotificationBellBadge({ count, ringClass = 'ring-white' }: { count: number; ringClass?: string }) {
  if (count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);

  return (
    <span
      className={`absolute right-0 top-0 z-20 flex h-4 min-w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff5f7a] px-0.5 text-[9px] font-bold leading-none text-white ${ringClass}`}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function notificationBellLinkClass(
  isActive: boolean,
  hasUnread: boolean,
  _variant: BellVariant = 'mobile',
): string {
  const base =
    'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-[12px] transition active:scale-[0.97]';

  if (isActive || hasUnread) {
    return `${base} bg-[#F47C8C] text-white`;
  }

  return `${base} bg-[#FFF1F4] text-[#111827] hover:bg-[#FFE4EA]`;
}

type NotificationBellLinkProps = {
  to: string;
  isActive: boolean;
  hasUnread: boolean;
  count: number;
  variant?: BellVariant;
  ringClass?: string;
  ariaLabel: string;
};

export function NotificationBellLink({
  to,
  isActive,
  hasUnread,
  count,
  variant = 'mobile',
  ringClass = 'ring-white',
  ariaLabel,
}: NotificationBellLinkProps) {
  return (
    <Link
      to={to}
      className={notificationBellLinkClass(isActive, hasUnread, variant)}
      aria-label={ariaLabel}
    >
      <IconNavNotifications className="relative z-10 h-5 w-5" />
      <NotificationBellBadge count={count} ringClass={ringClass} />
    </Link>
  );
}
