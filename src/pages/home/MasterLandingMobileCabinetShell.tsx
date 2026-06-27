import type { FC, ReactNode } from 'react';
import { masterLandingDemoShellRound } from './MasterLandingDemoCabinetLogo';
import { masterLandingDemoShellBackdropClass } from './masterLandingDemoOverlayTheme';
import {
  masterLandingDemoDesktopDrawerClass,
  masterLandingDemoMobileDrawerClass,
} from './MasterLandingDemoCabinetLogo';
import type { MasterLandingDesktopCabinetSection } from './MasterLandingDesktopCabinetShell';
import { useLandingDemoLayout } from './masterLandingDemoShared';

type MasterLandingMobileCabinetShellProps = {
  children: ReactNode;
  pageTitle: string;
  activeSection: MasterLandingDesktopCabinetSection;
  demoLayout?: 'drawer' | 'main';
};

function IconBurger({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const MasterLandingMobileCabinetShell: FC<MasterLandingMobileCabinetShellProps> = ({
  children,
  pageTitle,
  activeSection,
  demoLayout = 'drawer',
}) => {
  const { mobile } = useLandingDemoLayout();
  const drawerClass = mobile ? masterLandingDemoMobileDrawerClass : masterLandingDemoDesktopDrawerClass;
  const showNotifBadge = activeSection === 'notifications';

  return (
    <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-white ${masterLandingDemoShellRound}`}>
      <header className="shrink-0 border-b border-[#EAECEF] bg-white px-3 pb-2 pt-2.5" aria-hidden>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <p className="truncate text-[12px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[13px]">
            {pageTitle}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#111827]">
              <IconBell className="h-4 w-4" />
              {showNotifBadge ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff5f7a]" aria-hidden />
              ) : null}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#111827]">
              <IconBurger className="h-4 w-4" />
            </span>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden bg-[#f6f7fb]">
        {demoLayout === 'drawer' ? (
          <>
            <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-[#f6f7fb]" aria-hidden />
            <div className={masterLandingDemoShellBackdropClass} aria-hidden />
            <div className={drawerClass}>{children}</div>
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-[#f6f7fb]">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
