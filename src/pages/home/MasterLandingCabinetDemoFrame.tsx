import type { FC, ReactNode } from 'react';
import {
  MASTER_DEMO_FRAME_BG_SRC,
  masterDemoHeroPhoneFrame,
  masterDemoMediaFrame,
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
  if (variant === 'hero-phone') {
    return (
      <div
        className={`${masterDemoHeroPhoneFrame} pointer-events-none select-none touch-none [&_*]:!cursor-default`}
        style={demoFrameBgStyle}
        aria-label={ariaLabel}
        aria-hidden
      >
        <div className={masterDemoHeroPhoneInsetClass}>
          <div className={masterDemoHeroPhonePanelClass}>{children}</div>
        </div>
      </div>
    );
  }

  const shell = (
    <MasterLandingDesktopCabinetShell
      pageTitle={pageTitle}
      activeSection={activeSection}
      demoLayout={demoLayout}
    >
      {children}
    </MasterLandingDesktopCabinetShell>
  );

  return (
    <div
      className={`${masterDemoMediaFrame} pointer-events-none select-none touch-none [&_*]:!cursor-default`}
      style={demoFrameBgStyle}
      aria-label={ariaLabel}
      aria-hidden
    >
      <div className={masterDemoFrameInsetClass}>
        <div className={masterDemoFrameInsetInnerClass}>{shell}</div>
      </div>
    </div>
  );
};
