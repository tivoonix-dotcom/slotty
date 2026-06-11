import { Link, NavLink } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi2';
import { ADMIN_PATH, ADMIN_SERVICES_PATH, PLATFORM_ADMIN_PATH } from '../../app/paths';
import { planBadgeLabel } from '../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../features/billing/useMasterPlanEntitlements';
import { useAuth } from '../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../features/auth/lib/isPlatformAdmin';
import {
  MasterCabinetAvatar,
} from './profile/adminProfilePortrait';
import { useAdminNotifications } from './notifications/AdminNotificationsContext';
import { useAdminMasterCabinet } from './AdminMasterCabinetContext';
import {
  ADMIN_BILLING_NAV,
  ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  ADMIN_SETTINGS_NAV,
  AdminCabinetNavLink,
} from './adminCabinetNav';
import { AdminSectionAttentionBadge } from './shared/AdminSectionAttentionBadge';
import { useServicesCatalogAttention } from './services/useServicesCatalogAttention';
import {
  adminDesktopNavItemClass,
  adminDesktopSidebarNav,
  adminDesktopSidebarShell,
  adminSidebarFooterCard,
  adminSidebarTariffCard,
} from './adminCabinetLayout';
import { AdminTariffSidebarCardContent } from './shared/AdminTariffSidebarCardContent';

function SidebarUnreadBadge({ count }: { count: number }) {
  const label = count > 9 ? '9+' : String(count);

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5f7a] px-1.5 text-[10px] font-bold text-white">
      {label}
    </span>
  );
}

export function AdminDesktopSidebar() {
  const { planId } = useMasterPlanEntitlements();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const { draft } = useAdminMasterCabinet();
  const { profile } = useAuth();

  const displayName = draft.name?.trim() || profile?.full_name?.trim() || 'Мастер';
  const showPlatformAdmin = isPlatformAdmin(profile);
  const servicesNeedAttention = useServicesCatalogAttention();

  return (
    <aside className={adminDesktopSidebarShell}>
      <nav className={adminDesktopSidebarNav} aria-label="Кабинет мастера">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          Меню
        </p>

        {ADMIN_MAIN_NAV.map((item) => (
          <AdminCabinetNavLink
            key={item.to}
            item={item}
            className={(isActive) => adminDesktopNavItemClass(isActive)}
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} />
                  <span className="truncate">{item.label}</span>
                  {item.to === ADMIN_SERVICES_PATH && servicesNeedAttention ? (
                    <AdminSectionAttentionBadge className="ml-auto" />
                  ) : null}
                </>
              );
            }}
          </AdminCabinetNavLink>
        ))}

        <NavLink
          to={ADMIN_NOTIFICATIONS_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          {({ isActive }) => {
            const Icon = ADMIN_NOTIFICATIONS_NAV.icon;
            return (
              <>
                <Icon className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} />
                <span className="truncate">{ADMIN_NOTIFICATIONS_NAV.label}</span>
                {hasUnread ? <SidebarUnreadBadge count={unreadCount} /> : null}
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
                <Icon className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} />
                <span className="truncate">{ADMIN_BILLING_NAV.label}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isActive ? 'bg-[#ff5f7a]/15 text-[#ff5f7a]' : 'bg-[#FFF1F4] text-[#ff5f7a]'
                  }`}
                >
                  {planBadgeLabel(planId)}
                </span>
              </>
            );
          }}
        </NavLink>

        <NavLink
          to={ADMIN_SETTINGS_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          {({ isActive }) => {
            const Icon = ADMIN_SETTINGS_NAV.icon;
            return (
              <>
                <Icon className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} />
                <span className="truncate">{ADMIN_SETTINGS_NAV.label}</span>
              </>
            );
          }}
        </NavLink>

        {showPlatformAdmin ? (
          <>
            <p className="mb-2 mt-4 px-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Платформа
            </p>
            <NavLink
              to={PLATFORM_ADMIN_PATH}
              className={({ isActive }) => adminDesktopNavItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <HiSparkles className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} aria-hidden />
                  <span className="truncate">Админка SLOTTY</span>
                </>
              )}
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-[#EEEEEE] p-3">
        <Link to={ADMIN_BILLING_NAV.to} className={`${adminSidebarTariffCard} mb-0`}>
          <AdminTariffSidebarCardContent
            planLabel={planBadgeLabel(planId)}
            subtitle="Управление подпиской и лимитами"
            planId={planId}
          />
        </Link>

        <Link to={ADMIN_PATH} className={adminSidebarFooterCard}>
          <MasterCabinetAvatar
            name={displayName}
            photoUrl={draft.photoUrl}
            accountProfile={profile}
            sizeClass="h-10 w-10"
            ringClassName="ring-0"
            initialsClassName="text-[13px]"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[#111827]">
              {displayName}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">Кабинет мастера</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
