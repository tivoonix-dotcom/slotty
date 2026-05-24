import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import type { MasterPortfolioItem } from './types';
import { MasterExtraSections } from './MasterExtraSections';
import { MasterPortfolioRail } from './MasterPortfolioRail';
import { MasterProfileDesktopToolbar } from './MasterProfileDesktopToolbar';
import { MasterProfileDesktopHero } from './MasterProfileDesktopHero';
import { MasterProfileDesktopSidebar } from './MasterProfileDesktopSidebar';
import { MasterReviewsSection } from './MasterReviewsSection';
import { MasterServicesList } from './MasterServicesList';
import { MasterTrustStats } from './MasterTrustStats';
import { catalogCanvasClass, masterProfileDesktopGrid } from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  isFavorite: boolean;
  favoriteDisabled: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
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
  isFavorite,
  favoriteDisabled,
  onFavoriteToggle,
  onShare,
  onChooseTime,
  onPhoneUnavailable,
  highlightServiceId,
  onSelectService,
  onOpenGallery,
  portfolioItems,
}: Props) {
  return (
    <div className={`hidden min-h-dvh lg:block ${catalogCanvasClass}`}>
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} pb-12 pt-2`}>
        <MasterProfileDesktopToolbar
          masterName={master.masterName}
          isFavorite={isFavorite}
          favoriteDisabled={favoriteDisabled}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
        />

        <MasterProfileDesktopHero
          master={master}
          userLat={userLat}
          userLng={userLng}
          nearest={nearest}
          nearestLoading={nearestLoading}
        />

        <div className={`grid gap-6 ${masterProfileDesktopGrid}`}>
          <div className="min-w-0 space-y-4">
            <MasterServicesList
              services={master.services}
              categoryCode={master.categoryCode}
              categoryLabel={master.category}
              highlightServiceId={highlightServiceId}
              onSelect={onSelectService}
              onViewAll={() => onChooseTime()}
              layout="desktop"
            />

            {portfolioItems.length > 0 ? (
              <MasterPortfolioRail
                items={portfolioItems}
                onOpenGallery={onOpenGallery}
                onViewAll={() => onOpenGallery(0)}
                layout="desktop"
              />
            ) : null}

            <MasterTrustStats master={master} layout="desktop" />
            <MasterReviewsSection reviews={master.reviews} layout="desktop" />
            <MasterExtraSections master={master} layout="desktop" />
          </div>

          <MasterProfileDesktopSidebar
            master={master}
            nearest={nearest}
            nearestLoading={nearestLoading}
            onChooseTime={() => onChooseTime(nearest?.serviceId)}
            onPhoneUnavailable={onPhoneUnavailable}
          />
        </div>
      </div>
    </div>
  );
}
