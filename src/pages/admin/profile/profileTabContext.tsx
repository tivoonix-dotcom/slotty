import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProfileSectionId } from './ProfileSectionTabs';

export type { ProfileSectionId };

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

/** Табы встроены в карточку профиля (desktop + mobile). */
export function ProfileSectionTabsBar() {
  return null;
}
