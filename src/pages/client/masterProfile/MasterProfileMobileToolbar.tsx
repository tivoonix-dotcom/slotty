import { useEffect, useState } from 'react';
import { CLIENT_STICKY_BELOW_MOBILE_HEADER } from '../clientNavConstants';
import { catalogDesktopPanel, masterProfileMobileToolbarStickyClass } from './masterProfileTheme';
import { MasterProfileToolbarInner } from './MasterProfileToolbarInner';

type Props = {
  masterName: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  favoriteDisabled?: boolean;
};

export function MasterProfileMobileToolbar({
  masterName,
  isFavorite,
  onFavoriteToggle,
  onShare,
  favoriteDisabled = false,
}: Props) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`${masterProfileMobileToolbarStickyClass} ${CLIENT_STICKY_BELOW_MOBILE_HEADER}`}
    >
      <div className={`${catalogDesktopPanel} px-4 py-2.5 xl:px-6`}>
        <MasterProfileToolbarInner
          masterName={masterName}
          compact={compact}
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
          favoriteDisabled={favoriteDisabled}
        />
      </div>
    </div>
  );
}
