import { useLayoutEffect, useRef } from 'react';
import { MasterProfileToolbarInner } from './MasterProfileToolbarInner';

type Props = {
  masterName: string;
  showPro?: boolean;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onReport?: () => void;
  favoriteDisabled?: boolean;
};

export function MasterProfileDesktopToolbar({
  masterName,
  showPro = false,
  isFavorite,
  onFavoriteToggle,
  onShare,
  onReport,
  favoriteDisabled = false,
}: Props) {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncToolbarHeight = () => {
      document.documentElement.style.setProperty(
        '--master-profile-toolbar-h',
        `${el.offsetHeight}px`,
      );
    };

    syncToolbarHeight();
    const ro = new ResizeObserver(syncToolbarHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [masterName]);

  return (
    <header
      ref={headerRef}
      data-master-profile-toolbar="desktop"
      className="fixed inset-x-0 top-0 z-[50] w-full border-b border-[#EEEEEE] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
    >
      <div className="w-full px-6 py-2.5 xl:px-10">
        <MasterProfileToolbarInner
          masterName={masterName}
          showPro={showPro}
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
          onReport={onReport}
          favoriteDisabled={favoriteDisabled}
          actionSize="md"
          heroCollapsed
        />
      </div>
    </header>
  );
}
