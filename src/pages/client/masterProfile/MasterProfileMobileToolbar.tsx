import {
  masterProfileToolbarPositionClass,
  masterProfileToolbarShellBase,
  masterProfileToolbarSurfaceClass,
} from './masterProfileTheme';
import { MasterProfileToolbarInner } from './MasterProfileToolbarInner';
import { useMasterProfileHeroCollapsed } from './useMasterProfileHeroCollapsed';

type Props = {
  masterName: string;
  showPro?: boolean;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onReport?: () => void;
  favoriteDisabled?: boolean;
};

export function MasterProfileMobileToolbar({
  masterName,
  showPro = false,
  isFavorite,
  onFavoriteToggle,
  onShare,
  onReport,
  favoriteDisabled = false,
}: Props) {
  const heroCollapsed = useMasterProfileHeroCollapsed(Boolean(masterName.trim()));

  return (
    <header
      data-master-profile-toolbar="mobile"
      className={`${masterProfileToolbarShellBase} ${masterProfileToolbarPositionClass(heroCollapsed, 'mobile')} ${masterProfileToolbarSurfaceClass(heroCollapsed)}`}
    >
      <div className="px-4 py-2.5">
        <MasterProfileToolbarInner
          masterName={masterName}
          showPro={showPro}
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
          onReport={onReport}
          favoriteDisabled={favoriteDisabled}
          heroCollapsed={heroCollapsed}
        />
      </div>
    </header>
  );
}
