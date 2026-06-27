import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  getMasterRegisterPath,
  SERVICES_PATH,
} from '../app/paths';
import { useAuth } from '../features/auth/AuthProvider';
import { useIsMasterUser } from '../features/profile/hooks/useIsMasterUser';
import { LoadingScreen } from '../shared/ui/LoadingVideo';
import { HomeForMasters } from './home/HomeForMasters';
import { HomeMasterBookingsPromo } from './home/HomeMasterBookingsPromo';
import { MasterLandingHero } from './home/MasterLandingHero';
import { homeShell } from './home/homeLayout';
import { useLandingHashScroll } from '../shared/layout/SlottyHeader/useLandingHashScroll';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { HomeTariffs } from './HomeTariffs';
import { MasterLandingFaq } from './home/MasterLandingFaq';
import { MasterLandingJsonLd } from '../shared/seo/MasterLandingJsonLd';

export function MasterLanding() {
  useLandingHashScroll();
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const isMasterUser = useIsMasterUser();

  const registerPath = useMemo(() => getMasterRegisterPath(BECOME_MASTER_PATH), []);

  const onBecomeMaster = useCallback(() => {
    if (isMasterUser) {
      navigate(ADMIN_PATH);
      return;
    }
    navigate(registerPath);
  }, [isMasterUser, navigate, registerPath]);

  const onCatalog = useCallback(() => {
    navigate(SERVICES_PATH);
  }, [navigate]);

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  return (
    <div className="min-h-dvh bg-[#E29595] text-neutral-900">
      <MasterLandingJsonLd />
      <div className="overflow-x-clip rounded-b-[2.5rem] bg-white sm:rounded-b-[3rem]">
        <HomeHeader />

        <MasterLandingHero onBecomeMaster={onBecomeMaster} onCatalog={onCatalog} />

        <HomeForMasters
          masterCtaPath={registerPath}
          masterCtaLabel="Стать мастером"
        />

        <main
          className={`relative z-10 overflow-x-clip ${homeShell} pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-0`}
        >
          <HomeMasterBookingsPromo onMasterCabinet={onBecomeMaster} ctaLabel="Начать бесплатно" />

          <HomeTariffs />

          <MasterLandingFaq />
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
