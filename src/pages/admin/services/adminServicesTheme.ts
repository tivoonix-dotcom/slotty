export const SERVICES_PAGE_BG = 'bg-white';

const servicesTabPhotosDir = '/photos/' + encodeURIComponent('услуги') + '/';

/** Фото для шапок табов «Услуги» (`public/photos/услуги`). */
export function servicesTabPhotoSrc(fileName: string): string {
  return servicesTabPhotosDir + encodeURIComponent(fileName);
}
/** Высота плавающего таббара (72px + нижний отступ контейнера). */
export const SERVICES_TAB_BAR_HEIGHT = '5.75rem';
/** Отступ контента, чтобы список доскролливался выше фиксированного таббара. */
export const SERVICES_TAB_BAR_SCROLL_PAD = `calc(${SERVICES_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const servicesCard =
  'rounded-[22px] border border-[#EAECEF] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.05)]';

export const servicesCardPad = 'p-4';

export const servicesIconCircle =
  'flex shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C]';

export const servicesPinkBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-[15px] font-bold text-white shadow-[0_10px_26px_rgba(244,124,140,0.28)] transition hover:brightness-[0.98] active:scale-[0.98] disabled:opacity-50';

export const servicesChip =
  'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const servicesChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]';

export const servicesChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';

export const servicesInput =
  'w-full rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4]';
