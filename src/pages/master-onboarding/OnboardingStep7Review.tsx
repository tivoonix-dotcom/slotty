import type { DemoMasterService } from '../../features/services/model/demoMasters';

import { CLIENT_DESKTOP_SHELL_CLASS } from '../../shared/layout/clientShellLayout';

import { MasterProfileBookingCard } from '../client/masterProfile/MasterProfileBookingCard';

import { MasterProfileHeroCoverStack } from '../client/masterProfile/MasterProfileHeroCoverStack';

import { MasterProfileInfoSidebar } from '../client/masterProfile/MasterProfileInfoSidebar';

import { MasterProfileMainContent } from '../client/masterProfile/MasterProfileMainContent';

import { MasterProfileStatsRow } from '../client/masterProfile/MasterProfileStatsRow';

import { MasterPublicHeroSection } from '../client/masterProfile/MasterPublicHeroSection';

import { MasterServicesList } from '../client/masterProfile/MasterServicesList';

import {

  masterProfileCanvasClass,

  masterProfileDesktopLayout,

  masterProfileDesktopMainCol,

  masterProfileDesktopSidebarCol,

  masterProfileHeroContentOverlapClass,

} from '../client/masterProfile/masterProfileTheme';

import {

  buildOnboardingPublicProfile,

  type BuildOnboardingPublicProfileInput,

} from './buildOnboardingPublicProfile';

import { OnboardingReviewTrustTabs } from './OnboardingReviewTrustTabs';



type Props = BuildOnboardingPublicProfileInput;



const noop = () => {};

const noopService = (_service: DemoMasterService) => {};



/** Превью публичного профиля — тот же layout, что на `/master/:id`. */

export function OnboardingStep7Review(props: Props) {

  const master = buildOnboardingPublicProfile(props);



  return (

    <div className="mt-4 pb-2 lg:mt-6">

      <div

        className={`pointer-events-none rounded-[16px] ring-1 ring-[#EAECEF] lg:overflow-hidden ${masterProfileCanvasClass}`}

        aria-label="Превью профиля мастера"

      >

        <div className="hidden lg:block">

          <MasterProfileHeroCoverStack master={master} layout="desktop" />



          <div

            className={`${CLIENT_DESKTOP_SHELL_CLASS} mx-auto max-w-[1240px] pb-10 ${masterProfileHeroContentOverlapClass}`}

          >

            <MasterPublicHeroSection

              master={master}

              userLat={null}

              userLng={null}

              nearest={null}

              nearestLoading={false}

              layout="desktop"

              profileCardOnly

              className="mb-4"

            />



            <div className="mt-4">

              <MasterProfileStatsRow

                master={master}

                nearest={null}

                nearestLoading={false}

                layout="desktop"

              />

            </div>



            <div className={`mt-6 ${masterProfileDesktopLayout}`}>

              <div className={`space-y-5 ${masterProfileDesktopMainCol}`}>

                <MasterProfileMainContent

                  master={master}

                  topAchievements={[]}

                  topAchievementsReady

                  portfolioItems={[]}

                  onSelectService={noopService}

                  onChooseTime={noop}

                  onOpenGallery={noop}

                  onBookFromReviews={noop}

                  layout="desktop"

                  showMobileExtra={false}

                />

              </div>



              <div className={masterProfileDesktopSidebarCol}>

                <MasterProfileBookingCard

                  master={master}

                  nearest={null}

                  nearestLoading={false}

                  topAchievements={[]}

                  isFavorite={false}

                  favoriteDisabled

                  onChooseTime={noop}

                  onFavoriteToggle={noop}

                  onPhoneUnavailable={noop}

                />

                <MasterProfileInfoSidebar master={master} />

              </div>

            </div>

          </div>

        </div>



        <div className="min-w-0 lg:hidden">

          <MasterProfileHeroCoverStack master={master} layout="mobile" />



          <div

            className={`mx-auto w-full min-w-0 px-2 sm:px-4 ${masterProfileHeroContentOverlapClass}`}

          >

            <main className="min-w-0 space-y-3 pb-4">

              <MasterPublicHeroSection

                master={master}

                userLat={null}

                userLng={null}

                nearest={null}

                nearestLoading={false}

                layout="mobile"

                profileCardOnly

                embeddedPreview

              />



              <MasterServicesList

                services={master.services}

                categoryCode={master.categoryCode}

                categoryLabel={master.category}

                onSelect={noopService}

                previewMode

              />



              <OnboardingReviewTrustTabs

                certificates={props.certificates ?? []}

                educationItems={props.educationItems ?? []}

              />

            </main>

          </div>

        </div>

      </div>



      <p className="mt-4 rounded-[12px] bg-[#F5F5F5] px-3 py-2.5 text-center text-[12px] font-medium leading-snug text-[#6B7280] lg:mx-6">

        График записи и свободные окна появятся в кабинете после публикации

      </p>

    </div>

  );

}

