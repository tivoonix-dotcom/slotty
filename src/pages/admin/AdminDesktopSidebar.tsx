import { Link, NavLink } from 'react-router-dom';
import {
  HiArrowRight,
  HiCheckCircle,
  HiEllipsisHorizontal,
  HiSparkles,
} from 'react-icons/hi2';
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
import { ADMIN_PROFILE_COMPLETION_PATH } from '../../app/paths';
import { ADMIN_SIDEBAR_WIDTH, adminDesktopNavItemClass } from './adminCabinetLayout';
import { useProfileCompletionOverview } from './profile/useProfileCompletionOverview';

type Props = {
  onSupport: () => void;
  onDocuments: () => void;
};

function SidebarUnreadBadge({ count }: { count: number }) {
  const label = count > 9 ? '9+' : String(count);

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5f7a] px-1.5 text-[10px] font-bold text-white">
      {label}
    </span>
  );
}

function ProfileCompletionButton({
  percent,
  loading,
  isDone,
}: {
  percent: number;
  loading?: boolean;
  isDone?: boolean;
}) {
  const completed = isDone ?? (!loading && percent >= 100);

  return (
    <Link
      to={ADMIN_PROFILE_COMPLETION_PATH}
      className="mb-4 block overflow-hidden rounded-[22px] bg-white no-underline shadow-[0_14px_40px_rgba(255,95,122,0.14)] ring-1 ring-[#FFE1E8] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(255,95,122,0.2)]"
    >
      <div className="relative p-4">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff5f7a]/10 blur-2xl" />
        <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-[#ff9aad]/15 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5f7a] to-[#ff8aa0] text-white shadow-[0_10px_24px_rgba(255,95,122,0.35)]">
            {completed ? (
              <HiCheckCircle className="h-7 w-7" aria-hidden />
            ) : (
              <span className="text-[14px] font-black">{loading ? '…' : `${percent}%`}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-[#111827]">
              Профиль заполнен
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ff5f7a]">
              {loading ? 'Загрузка…' : `${percent}% готово`}
            </p>
          </div>

          <HiArrowRight className="h-5 w-5 shrink-0 text-[#ff5f7a]" aria-hidden />
        </div>

        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[#FFE8EE]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff5f7a] to-[#ff8aa0] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="relative mt-2 text-[11px] leading-snug text-[#6B7280]">
          Нажми, чтобы посмотреть, какие разделы уже готовы.
        </p>
      </div>
    </Link>
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
    draft.photoUrl?.trim() ||
    defaultMasterAvatarUrl(displayName);

  const {
    percent: completionPercent,
    showLoading: completionLoading,
    isComplete: profileComplete,
  } = useProfileCompletionOverview();

  return (
    <aside
      className={`${ADMIN_SIDEBAR_WIDTH} sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[#eef0f5] bg-white lg:flex`}
    >
      <div className="flex items-center gap-2.5 border-b border-[#eef0f5] px-5 py-5">
        <Link to={ADMIN_HUB_PATH} className="inline-flex items-center gap-2.5 no-underline">
          <img src={HEADER_LOGO_SRC} alt="SLOTTY" className="h-9 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label="Кабинет мастера">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          Меню
        </p>

        {ADMIN_MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => adminDesktopNavItemClass(isActive)}
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </>
              );
            }}
          </NavLink>
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
          to={ADMIN_LOGIN_METHODS_NAV.to}
          className={({ isActive }) => adminDesktopNavItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <ADMIN_LOGIN_METHODS_NAV.icon
                className={`shrink-0 ${isActive ? 'text-[#ff5f7a]' : ''}`}
              />
              <span className="truncate">{ADMIN_LOGIN_METHODS_NAV.label}</span>
            </>
          )}
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

      <div className="border-t border-[#eef0f5] p-4">
        <ProfileCompletionButton
          percent={completionPercent}
          loading={completionLoading}
          isDone={profileComplete}
        />

        <Link
          to={ADMIN_BILLING_NAV.to}
          className="mb-4 block rounded-[20px] bg-gradient-to-br from-[#FFF1F4] via-[#FFE8ED] to-[#FFF1F4] p-4 no-underline ring-1 ring-[#FDE8ED]"
        >
          <div className="flex items-start gap-2">
            <HiSparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5f7a]" aria-hidden />
            <div>
              <p className="text-[13px] font-bold leading-snug text-[#111827]">
                Тариф {planBadgeLabel(planId)}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
                Управление подпиской и лимитами
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3 rounded-[16px] bg-[#f6f7fb] px-3 py-2.5 ring-1 ring-[#eef0f5]">
          <img
            src={photoSrc}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover object-center"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#111827]">{displayName}</p>
            <p className="text-[11px] text-[#6B7280]">Кабинет мастера</p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-white hover:text-[#6B7280]"
            aria-label="Меню профиля"
          >
            <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}