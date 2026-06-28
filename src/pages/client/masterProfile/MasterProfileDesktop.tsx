import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import type { ExtendedMasterProfile, NearestSlotInfo, MasterPortfolioItem } from './types';
import { MasterProfileDesktopToolbar } from './MasterProfileDesktopToolbar';
import { MasterProfileHeroCoverStack } from './MasterProfileHeroCoverStack';
import { MasterPublicHeroSection } from './MasterPublicHeroSection';
import { MasterProfileStatsRow } from './MasterProfileStatsRow';
import { MasterProfileMainContent } from './MasterProfileMainContent';
import { MasterProfileBookingCard } from './MasterProfileBookingCard';
import { MasterProfileInfoSidebar } from './MasterProfileInfoSidebar';
import {
  masterProfileCanvasClass,
  masterProfileDesktopLayout,
  masterProfileDesktopMainCol,
  masterProfileDesktopSidebarCol,
  masterProfileHeroContentOverlapClass,
} from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  topAchievements?: MasterTopAchievement[];
  topAchievementsReady?: boolean;
  isFavorite: boolean;
  favoriteDisabled: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onReport?: () => void;
  onChooseTime: (serviceId?: string | null) => void;
  onPhoneUnavailable: () => void;
  highlightServiceId?: string | null;
  onSelectService: (service: DemoMasterService) => void;
  onOpenGallery: (index: number) => void;
  portfolioItems: MasterPortfolioItem[];
};

export function MasterProfileDesktop({
  master,
  userLat,
  userLng,
  nearest,
  nearestLoading,
  topAchievements = [],
  topAchievementsReady = true,
  isFavorite,
  favoriteDisabled,
  onFavoriteToggle,
  onShare,
  onReport,
  onChooseTime,
  onPhoneUnavailable,
  highlightServiceId,
  onSelectService,
  onOpenGallery,
  portfolioItems,
}: Props) {
  return (
    <div className={`hidden min-h-dvh lg:block ${masterProfileCanvasClass}`}>
      <MasterProfileDesktopToolbar
        masterName={master.masterName}
        showPro={master.isProEntitled === true}
        isFavorite={isFavorite}
        favoriteDisabled={favoriteDisabled}
        onFavoriteToggle={onFavoriteToggle}
        onShare={onShare}
        onReport={onReport}
      />

      <div className="pt-[var(--master-profile-toolbar-h,3.5rem)]">
        <MasterProfileHeroCoverStack master={master} layout="desktop" />

        <div className={`${CLIENT_DESKTOP_SHELL_CLASS} mx-auto max-w-[1240px] pb-12 ${masterProfileHeroContentOverlapClass}`}>
        <MasterPublicHeroSection
          master={master}
          userLat={userLat}
          userLng={userLng}
          nearest={nearest}
          nearestLoading={nearestLoading}
          layout="desktop"
          profileCardOnly
          className="mb-4"
        />

        <div className="mt-4">
          <MasterProfileStatsRow
            master={master}
            nearest={nearest}
            nearestLoading={nearestLoading}
            layout="desktop"
            onChooseTime={onChooseTime}
          />
        </div>

        <div className={`mt-6 ${masterProfileDesktopLayout}`}>
          <div className={`space-y-5 ${masterProfileDesktopMainCol}`}>
            <MasterProfileMainContent
              master={master}
              topAchievements={topAchievements}
              topAchievementsReady={topAchievementsReady}
              highlightServiceId={highlightServiceId}
              portfolioItems={portfolioItems}
              onSelectService={onSelectService}
              onChooseTime={onChooseTime}
              onOpenGallery={onOpenGallery}
              onBookFromReviews={() => onChooseTime(nearest?.serviceId)}
              layout="desktop"
              showMobileExtra={false}
            />
          </div>

          <div className={masterProfileDesktopSidebarCol}>
            <MasterProfileBookingCard
              master={master}
              nearest={nearest}
              nearestLoading={nearestLoading}
              topAchievements={topAchievements}
              isFavorite={isFavorite}
              favoriteDisabled={favoriteDisabled}
              onChooseTime={onChooseTime}
              onFavoriteToggle={onFavoriteToggle}
              onPhoneUnavailable={onPhoneUnavailable}
            />
            <MasterProfileInfoSidebar master={master} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
