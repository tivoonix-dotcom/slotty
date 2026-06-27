import type { ReactNode } from 'react';
import {
  masterLandingDemoDesktopDrawerClass,
  masterLandingDemoMobileDrawerClass,
} from './MasterLandingDemoCabinetLogo';
import {
  masterLandingDemoDrawerOverlayClass,
  masterLandingDemoMobileDrawerOverlayClass,
} from './masterLandingDemoOverlayTheme';
import { useLandingDemoLayout } from './masterLandingDemoShared';

/** Drawer демо: bottom sheet на мобилке, боковая панель на desktop. */
export function MasterLandingDemoDrawer({ children }: { children: ReactNode }) {
  const { mobile } = useLandingDemoLayout();

  return (
    <>
      <div
        className={mobile ? masterLandingDemoMobileDrawerOverlayClass : masterLandingDemoDrawerOverlayClass}
        aria-hidden
      />
      <div className={mobile ? masterLandingDemoMobileDrawerClass : masterLandingDemoDesktopDrawerClass}>
        {children}
      </div>
    </>
  );
}
