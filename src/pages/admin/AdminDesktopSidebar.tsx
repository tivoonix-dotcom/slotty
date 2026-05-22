import { Link, NavLink } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { planBadgeLabel } from '../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { defaultMasterAvatarUrl } from '../../features/master/model/masterDraftStorage';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAdminNotifications } from './notifications/AdminNotificationsContext';
import { useAdminMasterCabinet } from './AdminMasterCabinetContext';
import {
  ADMIN_BILLING_NAV,
  ADMIN_HUB_PATH,
  ADMIN_LOGIN_METHODS_NAV,
  ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  IconNavDocuments,
  IconNavSupport,
} from './adminCabinetNav';
import { ADMIN_SIDEBAR_WIDTH, adminDesktopNavItemClass } from './adminCabinetLayout';

type Props = {
  onSupport: () => void;
  onDocuments: () => void;
};

function SidebarUnreadBadge({ count }: { count: number }) {
  const label = count > 9 ? '9+' : String(count);
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/30 px-1.5 text-[10px] font-bold text-white">
      {label}
    </span>
  );
}

export function AdminDesktopSidebar({ onSupport, onDocuments }: Props) {
  const { planId } = useMasterPlanEntitlements();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const { draft } = useAdminMasterCabinet();
  const { profile } = useAuth();

  const displayName = draft.name?.trim() || profile?.full_name?.trim() || 'Мастер';
  const photoSrc =
    profile?.header_avatar_url?.trim() ||
    (draft.photoUrl?.trim() || defaultMasterAvatarUrl(displayName));

  return (
    <aside
      className={`${ADMIN_SIDEBAR_WIDTH} sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[#EAECEF] bg-white lg:flex`}
    >
      <div className="flex items-center gap-2.5 border-b border-[#F3F4F6] px-5 py-5">
        <Link to={ADMIN_HUB_PATH} className="inline-flex items-center gap-2.5 no-underline">
          <img src={HEADER_LOGO_SRC} alt="SLOTTY" className="h-9 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Кабинет мастера">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Меню</p>
        {ADMIN_MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => adminDesktopNavItemClass(isActive)}>
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon className={`shrink-0 ${isActive ? 'text-white' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}

        <div className="my-3 border-t border-[#F3F4F6]" />

        <NavLink
          to={ADMIN_NOTIFICATIONS_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          {({ isActive }) => {
            const Icon = ADMIN_NOTIFICATIONS_NAV.icon;
            return (
              <>
                <Icon className="shrink-0" />
                <span className="truncate">{ADMIN_NOTIFICATIONS_NAV.label}</span>
                {hasUnread && !isActive ? (
                  <span className="ml-auto rounded-full bg-[#F47C8C] px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
                {isActive && hasUnread ? <SidebarUnreadBadge count={unreadCount} /> : null}
              </>
            );
          }}
        </NavLink>

        <NavLink
          to={ADMIN_BILLING_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          {({ isActive }) => {
            const Icon = ADMIN_BILLING_NAV.icon;
            return (
              <>
                <Icon className="shrink-0" />
                <span className="truncate">{ADMIN_BILLING_NAV.label}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#F7F7F8] text-[#6B7280]'
                  }`}
                >
                  {planBadgeLabel(planId)}
                </span>
              </>
            );
          }}
        </NavLink>

        <NavLink
          to={ADMIN_LOGIN_METHODS_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          <>
            <ADMIN_LOGIN_METHODS_NAV.icon className="shrink-0" />
            <span className="truncate">{ADMIN_LOGIN_METHODS_NAV.label}</span>
          </>
        </NavLink>

        <button type="button" onClick={onSupport} className={adminDesktopNavItemClass(false)}>
          <IconNavSupport className="shrink-0" />
          <span className="truncate">Поддержка</span>
        </button>
        <button type="button" onClick={onDocuments} className={adminDesktopNavItemClass(false)}>
          <IconNavDocuments className="shrink-0" />
          <span className="truncate">Документы</span>
        </button>
      </nav>

      <div className="border-t border-[#F3F4F6] p-4">
        <Link
          to={ADMIN_BILLING_NAV.to}
          className="mb-4 block rounded-[20px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] p-4 text-white no-underline shadow-[0_12px_32px_rgba(255,95,122,0.35)]"
        >
          <p className="text-[13px] font-bold leading-snug">Тариф {planBadgeLabel(planId)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/85">Управление подпиской и лимитами</p>
        </Link>

        <div className="flex items-center gap-3 rounded-[16px] bg-[#F7F7F8] px-3 py-2.5">
          <img
            src={photoSrc}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover object-center ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#111827]">{displayName}</p>
            <p className="text-[11px] text-[#6B7280]">Кабинет мастера</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
