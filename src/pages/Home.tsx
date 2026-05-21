import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  getProfilePath,
  getServiceCategoryPath,
  MASTERS_PATH,
  SERVICES_PATH,
} from '../app/paths';
import { useMastersFeed } from '../features/booking/api/useMastersFeed';
import { useIsMasterUser } from '../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { useTelegram } from '../shared/hooks/useTelegram';
import { readTelegramWebAppStartParam } from '../shared/lib/telegramWebApp';
import { HomeForMasters } from './home/HomeForMasters';
import { HomeHeroStack } from './home/HomeHeroStack';
import { HomeHowItWorks } from './home/HomeHowItWorks';
import { HomeCategories } from './HomeCategories';
import { HomeFaq } from './HomeFaq';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { HomeQuickSlots } from './HomeQuickSlots';
import { HomeTariffs } from './HomeTariffs';
import { HomeTelegramShowcase } from './HomeTelegramShowcase';
import { HomeTopMasters } from './HomeTopMasters';
import { HomeTrust } from './HomeTrust';

export function Home() {
  const navigate = useNavigate();
  const { isReady, masterId, isTelegramWebApp } = useTelegram();
  const nativeStart = useMemo(() => readTelegramWebAppStartParam(), []);
  const { data: masters = [], isLoading } = useMastersFeed();
  const isMasterUser = useIsMasterUser();

  const masterNavPath = isMasterUser ? ADMIN_PATH : BECOME_MASTER_PATH;
  const masterCtaLabel = isMasterUser ? 'Кабинет мастера' : 'Я мастер';

  const pickClientRoleAnd = useCallback(
    async (path: string) => {
      void setProfileRole('client');
      navigate(path);
    },
    [navigate],
  );

  const onMasterCard = useCallback(
    (id: string) => {
      void setProfileRole('client');
      if (id.startsWith('demo-')) {
        navigate(BOOKING_PATH);
        return;
      }
      navigate(`${BOOKING_PATH}?master_id=${encodeURIComponent(id)}`);
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
    void pickClientRoleAnd(MASTERS_PATH);
  }, [pickClientRoleAnd]);

  const onSearch = useCallback(
    (q: string) => {
      void setProfileRole('client');
      if (q) {
        navigate(`${SERVICES_PATH}?q=${encodeURIComponent(q)}`);
      } else {
        navigate(SERVICES_PATH);
      }
    },
    [navigate],
  );

  const onBecomeMaster = useCallback(() => {
    navigate(masterNavPath);
  }, [navigate, masterNavPath]);

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
    <div className="min-h-dvh bg-[#FFFCFC] text-neutral-900">
      <HomeHeader isDemoMaster={isMasterUser} onProfileTab={onProfileTab} />

      <HomeHeroStack
        onFindMaster={onFindMaster}
        onBecomeMaster={onBecomeMaster}
        onSearch={onSearch}
        masterCtaLabel={masterCtaLabel}
      />

      <main className="relative z-10 mx-auto max-w-[1100px] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-0 sm:px-6">
        <HomeCategories onCategory={onCategory} />

        <HomeQuickSlots />

        <HomeTopMasters masters={masters} isLoading={isLoading} onPick={onMasterCard} />

        <HomeHowItWorks />

        <HomeTelegramShowcase />

        <HomeForMasters masterCtaPath={masterNavPath} masterCtaLabel={isMasterUser ? 'Открыть кабинет' : 'Стать мастером'} />

        <HomeTariffs />

        <HomeTrust />

        <HomeFaq />
      </main>

      <HomeFooter />
    </div>
  );
}
