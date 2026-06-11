/** Высота нижней панели табов — как ClientBottomNav в каталоге. */
export const ADMIN_MOBILE_TAB_BAR_HEIGHT = '3.5rem';

export const adminMobileTabBarScrollPad = `calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

/** Таббар + зазор, чтобы последняя карточка списка не пряталась под панель. */
export const adminMobileTabBarListScrollPad = `calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT} + 1rem + env(safe-area-inset-bottom, 0px))`;

/**
 * Tailwind-классы — только литералы (не `pb-[${…}]`, иначе JIT не соберёт стиль).
 * При смене ADMIN_MOBILE_TAB_BAR_HEIGHT обновить и здесь.
 */
export const adminMobileTabBarScrollPadClass =
  'pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]';

export const adminMobileTabBarListScrollPadClass =
  'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]';

/** Таббар + фиксированный футер формы (~5.5rem). */
export const adminMobileTabBarWithFormFooterPadClass =
  'pb-[calc(9rem+env(safe-area-inset-bottom,0px))]';

export const adminMobileTabBarScrollPadMaxLgClass =
  'max-lg:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]';

export const adminMobileTabBarWithFormFooterPadMaxLgClass =
  'max-lg:pb-[calc(9rem+env(safe-area-inset-bottom,0px))]';

/** FAB / тост над нижней панелью (+ 1rem зазор). */
export const adminMobileTabBarFabBottom = `calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT} + 1rem + env(safe-area-inset-bottom, 0px))`;

/** Кнопка таба в нижней панели (мобилка) — как ClientBottomNav. */
export function adminMobileSegmentTabClass(
  active: boolean,
  accent: 'brand' | 'schedule' = 'brand',
): string {
  const activeClass =
    accent === 'schedule' ? 'bg-[#3B4CCA] text-white' : 'bg-[#F47C8C] text-white';

  return `relative flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200 active:opacity-90 ${
    active ? activeClass : 'bg-white text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
  }`;
}