import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH, BOOKING_PATH, getProfilePath, SERVICES_PATH } from '../app/paths';
import { useMastersFeed } from '../features/booking/api/useMastersFeed';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { isDemoMaster } from '../features/profile/lib/demoMasterStorage';
import { useTelegram } from '../shared/hooks/useTelegram';
import { readTelegramWebAppStartParam } from '../shared/lib/telegramWebApp';
import { HomeCategories } from './HomeCategories';
import { HomeFaq } from './HomeFaq';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { HomeMapSection } from './HomeMapSection';
import { HomeQuickSlots } from './HomeQuickSlots';
import { HomeTariffs } from './HomeTariffs';
import { HomeTelegramShowcase } from './HomeTelegramShowcase';
import { HomeTopMasters } from './HomeTopMasters';
import { HomeTrust } from './HomeTrust';
import { HomeWeeklyTopMasters } from './HomeWeeklyTopMasters';

export function Home() {
  const navigate = useNavigate();
  const { isReady, masterId } = useTelegram();
  const nativeStart = useMemo(() => readTelegramWebAppStartParam(), []);
  const { data: masters = [], isLoading } = useMastersFeed();
  const demoMaster = isDemoMaster();

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

  const onCategory = useCallback(() => {
    void pickClientRoleAnd(BOOKING_PATH);
  }, [pickClientRoleAnd]);

  const onJoinFree = useCallback(() => {
    void pickClientRoleAnd(BOOKING_PATH);
  }, [pickClientRoleAnd]);

  const onFindServices = useCallback(() => {
    void pickClientRoleAnd(SERVICES_PATH);
  }, [pickClientRoleAnd]);

  const onBecomeMaster = useCallback(() => {
    navigate(BECOME_MASTER_PATH);
  }, [navigate]);

  const onProfileTab = useCallback(
    (tab: 'appointments' | 'favorites') => {
      void pickClientRoleAnd(getProfilePath(tab));
    },
    [pickClientRoleAnd],
  );

  if (nativeStart || (isReady && masterId)) {
    return <Navigate to={BOOKING_PATH} replace />;
  }

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <HomeHeader isDemoMaster={demoMaster} onProfileTab={onProfileTab} />

      <main className="relative z-10 mx-auto max-w-[1100px] px-4 pb-10 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:px-6">
        <section className="animate-fade-enter relative isolate mx-auto flex w-full max-w-4xl flex-col items-center overflow-x-clip pb-14 text-center sm:pb-16">
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-0 flex w-[118vw] max-w-none -translate-x-1/2 justify-center select-none sm:top-6"
            aria-hidden
          >
            <img
              src="/photos/hero.png"
              alt=""
              decoding="async"
              className="h-auto w-[min(145vw,48rem)] max-w-none translate-y-[19%] object-contain opacity-[0.22] sm:w-[min(120vw,54rem)] sm:translate-y-[22%]"
            />
          </div>

          <h1 className="relative z-10 mt-10 max-w-[min(100%,38rem)] text-balance font-sans text-[clamp(2.25rem,6.5vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-neutral-900 sm:mt-14 sm:max-w-[42rem]">
            Открывайте настоящую запись к мастерам.
          </h1>

          <div className="relative z-10 mt-[40px] mb-[20px] flex flex-row flex-wrap items-center justify-center gap-3 sm:mt-[48px] sm:gap-4">
            <button
              type="button"
              onClick={() => void onFindServices()}
              className="rounded-full bg-brand-primary px-8 py-3.5 text-[15px] font-semibold text-white outline-none ring-0 transition hover:opacity-90 active:scale-[0.99]"
            >
              Найти услуги
            </button>
            <button
              type="button"
              onClick={() => void onBecomeMaster()}
              className="rounded-full bg-neutral-100 px-8 py-3.5 text-[15px] font-semibold text-neutral-900 outline-none ring-0 transition hover:bg-neutral-200/90 active:scale-[0.99]"
            >
              Стать мастером
            </button>
          </div>
        </section>

        <HomeCategories onCategory={onCategory} />

        <HomeQuickSlots />

        <HomeWeeklyTopMasters />

        <HomeTopMasters masters={masters} isLoading={isLoading} onPick={onMasterCard} />

        <HomeMapSection />

        <HomeTelegramShowcase />

        <HomeTariffs />

        <HomeTrust onJoinFree={onJoinFree} />

        <HomeFaq />
      </main>

      <HomeFooter />
    </div>
  );
}
