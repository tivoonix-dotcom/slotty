import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH, getMasterRegisterPath, SERVICES_PATH } from '../app/paths';
import { useAuth } from '../features/auth/AuthProvider';
import {
  resolveMasterEntryLabel,
  resolveMasterEntryPath,
  resolveMasterHeroCtaLabel,
} from '../features/auth/lib/resolveMasterEntryPath';
import { useIsMasterUser } from '../features/profile/hooks/useIsMasterUser';
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
  const { isAuthenticated } = useAuth();
  const isMasterUser = useIsMasterUser();

  const masterEntry = useMemo(
    () => ({ isAuthenticated, isMasterUser }),
    [isAuthenticated, isMasterUser],
  );

  const masterEntryPath = useMemo(() => resolveMasterEntryPath(masterEntry), [masterEntry]);
  const masterEntryLabel = useMemo(() => resolveMasterEntryLabel(masterEntry), [masterEntry]);
  const heroCtaLabel = useMemo(() => resolveMasterHeroCtaLabel(masterEntry), [masterEntry]);
  const guestRegisterPath = useMemo(() => getMasterRegisterPath(BECOME_MASTER_PATH), []);

  const onBecomeMaster = useCallback(() => {
    navigate(masterEntryPath);
  }, [navigate, masterEntryPath]);

  const onCatalog = useCallback(() => {
    navigate(SERVICES_PATH);
  }, [navigate]);

  const promoCtaLabel = isMasterUser
    ? 'Открыть кабинет'
    : isAuthenticated
      ? 'Продолжить регистрацию'
      : 'Начать бесплатно';

  return (
    <div className="min-h-dvh bg-[#E29595] text-neutral-900">
      <MasterLandingJsonLd />
      <div className="overflow-x-clip rounded-b-[2.5rem] bg-white sm:rounded-b-[3rem]">
        <HomeHeader />

        <MasterLandingHero
          onBecomeMaster={onBecomeMaster}
          onCatalog={onCatalog}
          becomeMasterLabel={heroCtaLabel}
        />

        <HomeForMasters
          masterEntryPath={masterEntryPath}
          masterEntryLabel={masterEntryLabel}
          guestRegisterPath={guestRegisterPath}
          isMasterUser={isMasterUser}
          isAuthenticated={isAuthenticated}
        />

        <main
          className={`relative z-10 overflow-x-clip ${homeShell} pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-0`}
        >
          <HomeMasterBookingsPromo onMasterCabinet={onBecomeMaster} ctaLabel={promoCtaLabel} />

          <HomeTariffs />

          <MasterLandingFaq />
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
