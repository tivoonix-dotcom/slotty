import type { ComponentType, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi2';
import {
  ADMIN_BILLING_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_SERVICES_PATH,
  MASTER_SETTINGS_PATH,
  PLATFORM_ADMIN_PATH,
} from '../../../app/paths';
import { planBadgeLabel, type PlanId } from '../../../features/billing/model/masterPlans';
import {
  ADMIN_MAIN_NAV,
  ADMIN_SECTION_META,
  ADMIN_SETTINGS_NAV,
  AdminCabinetNavLink,
  IconNavBilling,
  IconNavNotifications,
  resolveAdminNavItemMeta,
} from '../adminCabinetNav';
import { AdminBottomSheet } from './AdminBottomSheet';
import { AdminSectionAttentionBadge } from './AdminSectionAttentionBadge';
import {
  cabinetBurgerIconWrapClass,
  cabinetBurgerNavItemClass,
  cabinetBurgerPlanBadgeClass,
  cabinetBurgerSectionLabel,
} from './adminCabinetBurgerTheme';

type Props = {
  open: boolean;
  onClose: () => void;
  servicesNeedAttention: boolean;
  hasUnread: boolean;
  unreadCount: number;
  planId: PlanId;
  showPlatformAdmin: boolean;
};

function UnreadBadge({ count, active }: { count: number; active: boolean }) {
  const label = count > 9 ? '9+' : String(count);
  return (
    <span
      className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
        active ? 'bg-white/25 text-white' : 'bg-[#F47C8C] text-white'
      }`}
    >
      {label}
    </span>
  );
}

function BurgerNavIcon({
  Icon,
  active,
}: {
  Icon: ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <span className={cabinetBurgerIconWrapClass(active)}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
    </span>
  );
}

function BurgerNavText({
  label,
  description,
  active,
}: {
  label: string;
  description?: string;
  active: boolean;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">{label}</span>
      {description ? (
        <span
          className={`mt-0.5 block line-clamp-2 text-[12px] font-normal leading-snug ${
            active ? 'text-white/85' : 'text-[#6B7280]'
          }`}
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}

function BurgerNavTrailing({
  active,
  children,
}: {
  active: boolean;
  children?: ReactNode;
}) {
  return (
    <span className="flex shrink-0 items-center gap-2 self-center">
      {children}
      <HiChevronRight
        className={`h-4 w-4 shrink-0 ${active ? 'text-white/70' : 'text-[#C4C9D4]'}`}
        aria-hidden
      />
    </span>
  );
}

function BurgerSectionLabel({ children }: { children: string }) {
  return <p className={`${cabinetBurgerSectionLabel} mb-2`}>{children}</p>;
}

export function AdminCabinetBurgerMenu({
  open,
  onClose,
  servicesNeedAttention,
  hasUnread,
  unreadCount,
  planId,
  showPlatformAdmin,
}: Props) {
  const planBadge = planBadgeLabel(planId);

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="Разделы"
      variant="catalog"
      borderless
    >
      <nav className="flex flex-col gap-2 pb-2" aria-label="Разделы кабинета">
        <BurgerSectionLabel>Работа</BurgerSectionLabel>

        {ADMIN_MAIN_NAV.map((item) => (
          <AdminCabinetNavLink
            key={item.to}
            item={item}
            onClick={onClose}
            className={(isActive) => cabinetBurgerNavItemClass(isActive)}
          >
            {({ isActive }) => {
              const Icon = item.icon;
              const meta = resolveAdminNavItemMeta(item);
              return (
                <>
                  <BurgerNavIcon Icon={Icon} active={isActive} />
                  <BurgerNavText
                    label={item.label}
                    description={meta?.description}
                    active={isActive}
                  />
                  <BurgerNavTrailing active={isActive}>
                    {item.to === ADMIN_SERVICES_PATH && servicesNeedAttention ? (
                      <AdminSectionAttentionBadge />
                    ) : null}
                  </BurgerNavTrailing>
                </>
              );
            }}
          </AdminCabinetNavLink>
        ))}

        <NavLink
          to={ADMIN_NOTIFICATIONS_PATH}
          onClick={onClose}
          className={({ isActive }) => cabinetBurgerNavItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <BurgerNavIcon Icon={IconNavNotifications} active={isActive} />
              <BurgerNavText
                label="Уведомления"
                description={ADMIN_SECTION_META[ADMIN_NOTIFICATIONS_PATH]?.description}
                active={isActive}
              />
              <BurgerNavTrailing active={isActive}>
                {!isActive && hasUnread ? <UnreadBadge count={unreadCount} active={false} /> : null}
              </BurgerNavTrailing>
            </>
          )}
        </NavLink>

        <div className="mt-2 border-t border-[#EBEBEB] pt-3">
          <BurgerSectionLabel>Аккаунт</BurgerSectionLabel>

          <div className="flex flex-col gap-2">
            <NavLink
              to={ADMIN_BILLING_PATH}
              onClick={onClose}
              className={({ isActive }) => cabinetBurgerNavItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <BurgerNavIcon Icon={IconNavBilling} active={isActive} />
                  <BurgerNavText
                    label="Мой тариф"
                    description={ADMIN_SECTION_META[ADMIN_BILLING_PATH]?.description}
                    active={isActive}
                  />
                  <BurgerNavTrailing active={isActive}>
                    <span className={cabinetBurgerPlanBadgeClass(isActive)}>{planBadge}</span>
                  </BurgerNavTrailing>
                </>
              )}
            </NavLink>

            <NavLink
              to={ADMIN_SETTINGS_NAV.to}
              onClick={onClose}
              className={({ isActive }) => cabinetBurgerNavItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <BurgerNavIcon Icon={ADMIN_SETTINGS_NAV.icon} active={isActive} />
                  <BurgerNavText
                    label={ADMIN_SETTINGS_NAV.label}
                    description={ADMIN_SECTION_META[MASTER_SETTINGS_PATH]?.description}
                    active={isActive}
                  />
                  <BurgerNavTrailing active={isActive} />
                </>
              )}
            </NavLink>

            {showPlatformAdmin ? (
              <NavLink
                to={PLATFORM_ADMIN_PATH}
                onClick={onClose}
                className={({ isActive }) => cabinetBurgerNavItemClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <span className={cabinetBurgerIconWrapClass(isActive)}>
                      <span className="text-[15px] font-semibold leading-none" aria-hidden>
                        ✦
                      </span>
                    </span>
                    <BurgerNavText
                      label="Админка SLOTTY"
                      description="Управление платформой: мастера, жалобы, промокоды"
                      active={isActive}
                    />
                    <BurgerNavTrailing active={isActive} />
                  </>
                )}
              </NavLink>
            ) : null}
          </div>
        </div>
      </nav>
    </AdminBottomSheet>
  );
}
