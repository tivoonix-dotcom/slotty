import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import type { ExtendedMasterProfile } from './types';
import type { MasterPortfolioItem } from './types';
import { MASTER_PROFILE_SECTION_IDS, type MasterProfileSectionId } from './masterProfileSectionIds';
import { MasterSectionNav } from './MasterSectionNav';
import { MasterProfileTopAchievements } from './MasterProfileTopAchievements';
import { MasterServicesList } from './MasterServicesList';
import { MasterPortfolioRail } from './MasterPortfolioRail';
import { MasterReviewsSection } from './MasterReviewsSection';
import { MasterExtraSections } from './MasterExtraSections';

type Props = {
  master: ExtendedMasterProfile;
  topAchievements: MasterTopAchievement[];
  topAchievementsReady?: boolean;
  highlightServiceId?: string | null;
  portfolioItems: MasterPortfolioItem[];
  onSelectService: (service: DemoMasterService) => void;
  onChooseTime: (serviceId?: string | null) => void;
  onOpenGallery: (index: number) => void;
  onBookFromReviews?: () => void;
  layout?: 'desktop' | 'mobile';
  showMobileExtra?: boolean;
  /** Узкий embed (онбординг step 7): без sticky-навигации, компактные отступы. */
  embeddedPreview?: boolean;
};

export function MasterProfileMainContent({
  master,
  topAchievements,
  topAchievementsReady = true,
  highlightServiceId,
  portfolioItems,
  onSelectService,
  onChooseTime,
  onOpenGallery,
  onBookFromReviews,
  layout = 'desktop',
  showMobileExtra = true,
  embeddedPreview = false,
}: Props) {
  const isDesktop = layout === 'desktop';
  const navIds: MasterProfileSectionId[] = [
    MASTER_PROFILE_SECTION_IDS.services,
    ...(portfolioItems.length > 0 ? [MASTER_PROFILE_SECTION_IDS.portfolio] : []),
    MASTER_PROFILE_SECTION_IDS.reviews,
    ...(isDesktop
      ? []
      : [MASTER_PROFILE_SECTION_IDS.about, MASTER_PROFILE_SECTION_IDS.address, MASTER_PROFILE_SECTION_IDS.rules]),
  ];

  return (
    <div className={`space-y-4 ${embeddedPreview ? 'min-w-0' : ''}`}>
      <MasterSectionNav visibleIds={navIds} embeddedPreview={embeddedPreview} />

      {embeddedPreview && topAchievements.length === 0 ? null : (
        <MasterProfileTopAchievements
          achievements={topAchievements}
          ready={topAchievementsReady}
          layout={isDesktop ? 'desktop' : 'stack'}
        />
      )}

      <div id={MASTER_PROFILE_SECTION_IDS.services}>
        <MasterServicesList
          services={master.services}
          categoryCode={master.categoryCode}
          categoryLabel={master.category}
          highlightServiceId={highlightServiceId}
          onSelect={onSelectService}
          onViewAll={() => onChooseTime()}
          onBookService={(service) => onChooseTime(service.id)}
          layout={isDesktop ? 'desktop' : 'stack'}
          previewMode={embeddedPreview}
        />
      </div>

      {portfolioItems.length > 0 ? (
        <div id={MASTER_PROFILE_SECTION_IDS.portfolio}>
          <MasterPortfolioRail
            items={portfolioItems}
            onOpenGallery={onOpenGallery}
            onViewAll={() => onOpenGallery(0)}
            layout={isDesktop ? 'desktop' : 'stack'}
          />
        </div>
      ) : null}

      <div id={MASTER_PROFILE_SECTION_IDS.reviews}>
        <MasterReviewsSection
          reviews={master.reviews}
          onBook={onBookFromReviews ?? (() => onChooseTime())}
          layout={isDesktop ? 'desktop' : 'stack'}
        />
      </div>

      {!isDesktop && showMobileExtra ? <MasterExtraSections master={master} layout="stack" /> : null}
    </div>
  );
}
