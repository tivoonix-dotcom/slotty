import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { MasterPublicHeroCover } from './MasterPublicHeroCover';
import { MasterPublicHeroProfileCard } from './MasterPublicHeroProfileCard';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  layout?: 'desktop' | 'mobile';
  onChooseTime?: () => void;
  className?: string;
  /** Обложка вне max-width контейнера — только карточка профиля. */
  profileCardOnly?: boolean;
  embeddedPreview?: boolean;
};

export function MasterPublicHeroSection({
  master,
  userLat: _userLat,
  userLng: _userLng,
  nearest,
  nearestLoading,
  layout = 'desktop',
  onChooseTime,
  className = '',
  profileCardOnly = false,
  embeddedPreview = false,
}: Props) {
  if (profileCardOnly) {
    return (
      <header className={className}>
        <MasterPublicHeroProfileCard
          master={master}
          nearest={nearest}
          nearestLoading={nearestLoading}
          layout={layout}
          onChooseTime={onChooseTime}
          embeddedPreview={embeddedPreview}
        />
      </header>
    );
  }

  return (
    <header className={className}>
      <MasterPublicHeroCover master={master} layout={layout} />
      <MasterPublicHeroProfileCard
        master={master}
        nearest={nearest}
        nearestLoading={nearestLoading}
        layout={layout}
        onChooseTime={onChooseTime}
      />
    </header>
  );
}
