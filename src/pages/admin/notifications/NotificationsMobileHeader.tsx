import { Link } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import { ADMIN_PATH } from '../../../app/paths';
import { NOTIFICATIONS_GRADIENT } from './adminNotificationsTheme';

type Props = {
  unreadCount: number;
};

export function NotificationsMobileHeader({ unreadCount }: Props) {
  const subtitle =
    unreadCount === 0
      ? 'Все прочитаны'
      : unreadCount === 1
        ? '1 новое'
        : `${unreadCount} новых`;

  return (
    <div className="space-y-3 lg:hidden">
      <Link
        to={ADMIN_PATH}
        className="inline-flex min-h-10 items-center text-[14px] font-semibold text-[#6B7280] transition hover:text-[#ff5f7a]"
      >
        ← Профиль мастера
      </Link>
      <section className={`overflow-hidden rounded-[22px] ${NOTIFICATIONS_GRADIENT} p-5 text-white shadow-[0_14px_40px_rgba(255,95,122,0.2)]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] font-black tracking-[-0.04em]">Уведомления</p>
            <p className="mt-1 text-[14px] font-bold text-white/85">{subtitle}</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/15">
            <HiBellAlert className="h-6 w-6" aria-hidden />
          </span>
        </div>
        {unreadCount > 0 ? (
          <p className="mt-4 text-[40px] font-black leading-none tabular-nums tracking-[-0.06em]">
            {unreadCount}
          </p>
        ) : null}
      </section>
    </div>
  );
}
