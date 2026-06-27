import type { FC, ReactNode } from 'react';
import {
  MASTER_DEMO_FRAME_BG_SRC,
  masterDemoHeroPhoneFrame,
  masterDemoMediaFrame,
  masterDemoMobileFrame,
  masterDemoMobileStageClass,
} from './homeLandingMasterDemoTheme';
import {
  masterDemoFrameInsetClass,
  masterDemoFrameInsetInnerClass,
  masterDemoHeroPhoneInsetClass,
  masterDemoHeroPhonePanelClass,
} from './MasterLandingDemoCabinetLogo';
import {
  MasterLandingDesktopCabinetShell,
  type MasterLandingDesktopCabinetSection,
} from './MasterLandingDesktopCabinetShell';
import { MasterLandingMobileCabinetShell } from './MasterLandingMobileCabinetShell';
import {
  LandingDemoLayoutProvider,
  useLandingDemoMobileLayout,
} from './masterLandingDemoShared';

type MasterLandingCabinetDemoFrameProps = {
  children: ReactNode;
  variant?: 'card' | 'hero-phone';
  ariaLabel: string;
  pageTitle?: string;
  activeSection?: MasterLandingDesktopCabinetSection;
  demoLayout?: 'drawer' | 'main';
};

const demoFrameBgStyle = {
  backgroundImage: `url('${MASTER_DEMO_FRAME_BG_SRC}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
} as const;

export const MasterLandingCabinetDemoFrame: FC<MasterLandingCabinetDemoFrameProps> = ({
  children,
  variant = 'card',
  ariaLabel,
  pageTitle = 'Кабинет',
  activeSection = 'services',
  demoLayout = 'drawer',
}) => {
  const mobileLayout = useLandingDemoMobileLayout();

  /** Hero — только модалка «Новая услуга» на фоне, без shell кабинета. */
  if (variant === 'hero-phone') {
    return (
      <div
        className={`${masterDemoHeroPhoneFrame} pointer-events-none select-none touch-none [&_*]:!cursor-default`}
        style={demoFrameBgStyle}
        aria-label={ariaLabel}
        aria-hidden
      >
        <div className={masterDemoHeroPhoneInsetClass}>
          <div className={masterDemoHeroPhonePanelClass}>
            <LandingDemoLayoutProvider mobile={false}>{children}</LandingDemoLayoutProvider>
          </div>
        </div>
      </div>
    );
  }

  const shell = mobileLayout ? (
    <MasterLandingMobileCabinetShell
      pageTitle={pageTitle}
      activeSection={activeSection}
      demoLayout={demoLayout}
    >
      {children}
    </MasterLandingMobileCabinetShell>
  ) : (
    <MasterLandingDesktopCabinetShell
      pageTitle={pageTitle}
      activeSection={activeSection}
      demoLayout={demoLayout}
    >
      {children}
    </MasterLandingDesktopCabinetShell>
  );

  const inner = (
    <LandingDemoLayoutProvider mobile={mobileLayout}>{shell}</LandingDemoLayoutProvider>
  );

  if (mobileLayout) {
    return (
      <div
        className={`${masterDemoMobileFrame} pointer-events-none select-none touch-none [&_*]:!cursor-default`}
        aria-label={ariaLabel}
        aria-hidden
      >
        <div className={`${masterDemoMobileStageClass} p-2 sm:p-2.5`}>{inner}</div>
      </div>
    );
  }

  return (
    <div
      className={`${masterDemoMediaFrame} pointer-events-none select-none touch-none [&_*]:!cursor-default`}
      style={demoFrameBgStyle}
      aria-label={ariaLabel}
      aria-hidden
    >
      <div className={masterDemoFrameInsetClass}>
        <div className={masterDemoFrameInsetInnerClass}>{inner}</div>
      </div>
    </div>
  );
};
