import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  BOOKING_PATH,
  getProfilePath,
  getServiceCategoryPath,
  MASTER_START_PATH,
  SERVICES_PATH,
} from '../app/paths';
import { useIsMasterUser } from '../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { useTelegram } from '../shared/hooks/useTelegram';
import { readTelegramWebAppStartParam } from '../shared/lib/telegramWebApp';
import { HomeStructuredData } from '../shared/seo/HomeStructuredData';
import { HomeHeroStack } from './home/HomeHeroStack';
import { HomeLandingFeatureRows } from './home/HomeLandingFeatureRows';
import { homeShell } from './home/homeLayout';
import { HomeCategories } from './HomeCategories';
import { HomeFaq } from './HomeFaq';
import { useLandingHashScroll } from '../shared/layout/SlottyHeader/useLandingHashScroll';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { HomeTrust } from './HomeTrust';

export function Home() {
  useLandingHashScroll();
  const navigate = useNavigate();
  const { isReady, masterId, isTelegramWebApp } = useTelegram();
  const nativeStart = useMemo(() => readTelegramWebAppStartParam(), []);
  const isMasterUser = useIsMasterUser();

  const pickClientRoleAnd = useCallback(
    async (path: string) => {
      void setProfileRole('client');
      navigate(path);
    },
    [navigate],
  );

  const onCategory = useCallback(
    (category: string) => {
      void pickClientRoleAnd(getServiceCategoryPath(category));
    },
    [pickClientRoleAnd],
  );

  const onFindMaster = useCallback(() => {
    void pickClientRoleAnd(SERVICES_PATH);
  }, [pickClientRoleAnd]);

  const onBecomeMaster = useCallback(() => {
    navigate(MASTER_START_PATH);
  }, [navigate]);

  const onProfileTab = useCallback(
    (tab: 'appointments' | 'favorites') => {
      void pickClientRoleAnd(getProfilePath(tab));
    },
    [pickClientRoleAnd],
  );

  if (isTelegramWebApp && (nativeStart || (isReady && masterId))) {
    return <Navigate to={BOOKING_PATH} replace />;
  }

  return (
    <div className="min-h-dvh bg-[#E29595] text-neutral-900">
      <HomeStructuredData />
      <div className="overflow-x-visible rounded-b-[2.5rem] bg-white sm:rounded-b-[3rem]">
        <HomeHeader isDemoMaster={isMasterUser} onProfileTab={onProfileTab} />

        <HomeHeroStack onFindMaster={onFindMaster} onBecomeMaster={onBecomeMaster} />

        <HomeLandingFeatureRows />

        <main
          className={`relative z-10 overflow-x-visible ${homeShell} pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-0`}
        >
          <HomeCategories onCategory={onCategory} />

          <HomeTrust />

          <HomeFaq />
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
