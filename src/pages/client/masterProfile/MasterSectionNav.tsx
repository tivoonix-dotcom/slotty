import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MASTER_PROFILE_NAV_ITEMS,
  scrollToMasterProfileSection,
  type MasterProfileSectionId,
} from './masterProfileSectionIds';
import {
  masterProfileSectionNavTabActive,
  masterProfileSectionNavTabIdle,
  masterProfileSectionNavTray,
} from './masterProfileTheme';

type Props = {
  visibleIds?: MasterProfileSectionId[];
  embeddedPreview?: boolean;
};

function navGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  return 'grid-cols-3';
}

export function MasterSectionNav({ visibleIds, embeddedPreview = false }: Props) {
  const items = useMemo(
    () =>
      visibleIds
        ? MASTER_PROFILE_NAV_ITEMS.filter((item) => visibleIds.includes(item.id))
        : MASTER_PROFILE_NAV_ITEMS,
    [visibleIds],
  );

  const [active, setActive] = useState<MasterProfileSectionId | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id as MasterProfileSectionId | undefined;
        if (top) setActive(top);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  const onClick = useCallback((id: MasterProfileSectionId) => {
    setActive(id);
    scrollToMasterProfileSection(id);
  }, []);

  if (items.length === 0) return null;

  if (embeddedPreview) {
    return (
      <nav className="min-w-0" aria-label="Разделы профиля">
        <div className={masterProfileSectionNavTray}>
          <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onClick(item.id)}
                className={`shrink-0 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition ${
                  active === item.id ? masterProfileSectionNavTabActive : masterProfileSectionNavTabIdle
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky z-20 top-[calc(max(0.25rem,env(safe-area-inset-top,0px))+3.25rem)] mb-1 bg-[#F6F6F7]/95 pb-2 pt-1 backdrop-blur-sm lg:static lg:mb-0 lg:bg-transparent lg:pb-0 lg:pt-0 lg:backdrop-blur-none"
      aria-label="Разделы профиля"
    >
      <div className={masterProfileSectionNavTray}>
        <div className={`grid w-full gap-1 ${navGridClass(items.length)}`}>
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onClick(item.id)}
                className={`flex min-h-11 items-center justify-center rounded-[10px] px-3 text-[14px] font-semibold transition ${
                  isActive ? masterProfileSectionNavTabActive : masterProfileSectionNavTabIdle
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
