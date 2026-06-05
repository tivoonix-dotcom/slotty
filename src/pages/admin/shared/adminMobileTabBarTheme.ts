/** Высота плавающей нижней панели табов (72px + отступ контейнера). */
export const ADMIN_MOBILE_TAB_BAR_HEIGHT = '5.75rem';

export const adminMobileTabBarScrollPad = `calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

/** Кнопка таба в нижней панели (мобилка). */
export function adminMobileSegmentTabClass(
  active: boolean,
  accent: 'brand' | 'schedule' = 'brand',
): string {
  const activeClass =
    accent === 'schedule'
      ? 'bg-[#3B4CCA] text-white'
      : 'bg-[#F47C8C] text-white';

  return `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[12px] px-1.5 py-2 transition duration-200 active:scale-[0.96] ${
    active ? activeClass : 'text-[#9CA3AF] hover:bg-[#F5F5F5] hover:text-[#374151]'
  }`;
}