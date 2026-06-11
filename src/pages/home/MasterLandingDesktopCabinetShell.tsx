import type { FC, ReactNode } from 'react';
import {
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_PATH,
  ADMIN_SERVICES_PATH,
  getMasterAdminAppointmentsPath,
} from '../../app/paths';
import { getServiceCoverStockPhotoUrl } from '../../features/catalog/serviceCoverStockPhoto';
import {
  ADMIN_BILLING_NAV,
  ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  ADMIN_SETTINGS_NAV,
  type AdminNavItem,
} from '../admin/adminCabinetNav';
import { adminDesktopNavItemClass, adminSidebarTariffCard } from '../admin/adminCabinetLayout';
import { AdminTariffSidebarCardContent } from '../admin/shared/AdminTariffSidebarCardContent';
import { AdminSectionAttentionBadge } from '../admin/shared/AdminSectionAttentionBadge';
import {
  masterLandingDemoHeaderRowPx,
  MasterLandingDemoCabinetLogo,
  masterLandingDemoDrawerClass,
  masterLandingDemoShellRound,
  masterLandingDemoSidebarColClass,
} from './MasterLandingDemoCabinetLogo';
import { masterLandingDemoShellBackdropClass } from './masterLandingDemoOverlayTheme';
import {
  MASTER_LANDING_DEMO_MASTER_INITIALS,
  MASTER_LANDING_DEMO_MASTER_NAME,
} from './masterLandingDemoPersona';

export type MasterLandingDesktopCabinetSection =
  | 'profile'
  | 'services'
  | 'schedule'
  | 'appointments'
  | 'notifications';

type MasterLandingDesktopCabinetShellProps = {
  children: ReactNode;
  pageTitle: string;
  activeSection: MasterLandingDesktopCabinetSection;
  demoLayout?: 'drawer' | 'main';
};

const APPOINTMENTS_PATH = getMasterAdminAppointmentsPath({ tab: 'requests' });

function demoNavClass(active: boolean): string {
  return adminDesktopNavItemClass(active)
    .replace('min-h-11', 'min-h-8')
    .replace('gap-3', 'gap-2')
    .replace('px-3.5', 'px-2')
    .replace('rounded-[14px]', 'rounded-[10px]')
    .replace('text-[14px]', 'text-[10px]')
    .concat(' lg:min-h-9 lg:gap-2.5 lg:px-2.5 lg:text-[11px]');
}

function isNavActive(item: AdminNavItem, activeSection: MasterLandingDesktopCabinetSection): boolean {
  if (activeSection === 'profile') return item.to === ADMIN_PATH && item.end === true;
  if (activeSection === 'services') return item.to === ADMIN_SERVICES_PATH;
  if (activeSection === 'schedule') return item.to === ADMIN_SCHEDULE_PATH;
  if (activeSection === 'notifications') return item.to === ADMIN_NOTIFICATIONS_PATH;
  return item.to === APPOINTMENTS_PATH;
}

function DemoSidebarNavItem({
  item,
  active,
  badge,
}: {
  item: AdminNavItem;
  active: boolean;
  badge?: ReactNode;
}) {
  const Icon = item.icon;
  return (
    <div className={demoNavClass(active)}>
      <Icon className={`h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4 ${active ? 'text-[#ff5f7a]' : ''}`} />
      <span className="truncate">{item.label}</span>
      {badge}
    </div>
  );
}

function SidebarUnreadBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[8px] font-bold text-white lg:h-5 lg:min-w-5 lg:text-[9px]">
      {count}
    </span>
  );
}

function ServicesBackdrop() {
  const cover = getServiceCoverStockPhotoUrl('manicure', 'Маникюр');
  const rows = [
    { title: 'Маникюр с покрытием', price: '45 BYN' },
    { title: 'Педикюр классический', price: '55 BYN' },
    { title: 'Гель-лак', price: '35 BYN' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] p-3 pt-2 sm:p-4">
      <div className="mb-2 flex gap-1.5">
        <span className="rounded-full bg-[#FFF1F4] px-2 py-1 text-[9px] font-semibold text-[#ff5f7a]">Каталог</span>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-[#6B7280]">Прайс</span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.title} className="flex items-center gap-2 overflow-hidden rounded-[12px] bg-white p-2 ring-1 ring-[#EEEEEE]">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-[#EBEBEB]">
              <img src={cover} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-[#111827]">{row.title}</p>
              <p className="text-[9px] font-medium text-[#6B7280]">{row.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] p-3 pt-2 sm:p-4">
      <div className="mb-2 flex gap-1.5">
        <span className="rounded-full bg-[#EEF0FC] px-2 py-1 text-[9px] font-semibold text-[#3B4CCA]">Календарь</span>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-[#6B7280]">Окна</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[6px] ${i === 4 ? 'bg-[#EEF0FC] ring-1 ring-[#3B4CCA]/30' : 'bg-white ring-1 ring-[#EEEEEE]'}`}
          />
        ))}
      </div>
    </div>
  );
}

function DemoBackdrop({ section }: { section: MasterLandingDesktopCabinetSection }) {
  if (section === 'schedule') return <ScheduleBackdrop />;
  return <ServicesBackdrop />;
}

export const MasterLandingDesktopCabinetShell: FC<MasterLandingDesktopCabinetShellProps> = ({
  children,
  pageTitle,
  activeSection,
  demoLayout = 'drawer',
}) => (
  <div
    className={`grid h-full min-h-0 w-full bg-white ${masterLandingDemoShellRound}`}
    style={{
      gridTemplateColumns: `${masterLandingDemoSidebarColClass} minmax(0, 1fr)`,
      gridTemplateRows: `${masterLandingDemoHeaderRowPx} minmax(0, 1fr)`,
    }}
  >
    <div className="col-start-1 row-start-1 h-full min-h-0 overflow-hidden border-b border-r border-[#eef0f5] bg-white">
      <MasterLandingDemoCabinetLogo />
    </div>

    <h1 className="col-start-2 row-start-1 flex min-w-0 items-center truncate border-b border-[#EAECEF] bg-white px-3 text-[11px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[13px] lg:text-[15px]">
      {pageTitle}
    </h1>

    <aside className="col-start-1 row-start-2 flex min-h-0 flex-col overflow-hidden border-r border-[#eef0f5] bg-white">
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2 py-2 sm:px-2.5 lg:gap-1 lg:py-3" aria-hidden>
        <p className="mb-1 px-1.5 text-[8px] font-bold uppercase tracking-wider text-[#9CA3AF] lg:mb-2 lg:text-[9px]">
          Меню
        </p>
        {ADMIN_MAIN_NAV.map((item) => (
          <DemoSidebarNavItem
            key={item.to}
            item={item}
            active={isNavActive(item, activeSection)}
            badge={
              activeSection === 'services' && item.to === ADMIN_SERVICES_PATH ? (
                <AdminSectionAttentionBadge className="ml-auto scale-75" />
              ) : null
            }
          />
        ))}
        <DemoSidebarNavItem
          item={ADMIN_NOTIFICATIONS_NAV}
          active={activeSection === 'notifications'}
          badge={activeSection === 'notifications' ? <SidebarUnreadBadge count={1} /> : null}
        />
        <DemoSidebarNavItem
          item={ADMIN_BILLING_NAV}
          active={false}
          badge={
            <span className="ml-auto rounded-full bg-[#FFF1F4] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#ff5f7a]">
              Pro
            </span>
          }
        />
        <DemoSidebarNavItem item={ADMIN_SETTINGS_NAV} active={false} />
      </nav>

      <div className="shrink-0 space-y-1.5 border-t border-[#EEEEEE] p-2 sm:p-2.5">
        <div className={`${adminSidebarTariffCard} scale-[0.82] origin-left p-2`}>
          <AdminTariffSidebarCardContent
            planLabel="Pro"
            subtitle="Подписка активна"
            planId="pro"
          />
        </div>
        <div className="flex items-center gap-2 overflow-hidden rounded-[12px] bg-[#F6F7FB] p-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[9px] font-bold text-[#ff5f7a]">
            {MASTER_LANDING_DEMO_MASTER_INITIALS}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-[#111827]">{MASTER_LANDING_DEMO_MASTER_NAME}</p>
            <p className="truncate text-[8px] text-[#6B7280]">Кабинет мастера</p>
          </div>
        </div>
      </div>
    </aside>

    <main className="relative col-start-2 row-start-2 min-h-0 overflow-hidden bg-[#f6f7fb]">
      {demoLayout === 'drawer' ? (
        <>
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <DemoBackdrop section={activeSection} />
          </div>
          <div className={masterLandingDemoShellBackdropClass} aria-hidden />
          <div className={masterLandingDemoDrawerClass}>{children}</div>
        </>
      ) : (
        <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-[#f6f7fb]">
          {children}
        </div>
      )}
    </main>
  </div>
);
