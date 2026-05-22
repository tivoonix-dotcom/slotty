import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import { SectionTabs, type ProfileSectionId } from './AdminProfileCabinetUi';

/** Высота нижней панели вкладок (для отступа контента). */
export const PROFILE_TAB_BAR_HEIGHT = '5.75rem';

type ProfileTabContextValue = {
  activeSection: ProfileSectionId;
  setActiveSection: (section: ProfileSectionId) => void;
};

const ProfileTabContext = createContext<ProfileTabContextValue | null>(null);

export function ProfileTabProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<ProfileSectionId>('main');
  const value = useMemo(
    () => ({ activeSection, setActiveSection }),
    [activeSection],
  );

  return <ProfileTabContext.Provider value={value}>{children}</ProfileTabContext.Provider>;
}

export function useProfileTabs(): ProfileTabContextValue {
  const ctx = useContext(ProfileTabContext);
  if (!ctx) {
    throw new Error('useProfileTabs must be used within ProfileTabProvider');
  }
  return ctx;
}

/** Табы профиля: снизу на мобиле, сверху контента на десктопе. */
export function ProfileSectionTabsBar({ placement = 'mobile' }: { placement?: 'mobile' | 'desktop' }) {
  const { pathname } = useLocation();
  const isProfileHome = pathname === ADMIN_PATH;

  if (!isProfileHome) return null;

  const { activeSection, setActiveSection } = useProfileTabs();

  if (placement === 'desktop') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:hidden">
      <div className="pointer-events-auto w-full max-w-[460px]">
        <SectionTabs active={activeSection} onChange={setActiveSection} />
      </div>
    </div>
  );
}
