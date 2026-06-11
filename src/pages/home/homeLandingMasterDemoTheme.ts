/** Обёртки и рамки для интерактивных демо кабинета на лендинге мастера. */

/** Фон за демо-модалками (`public/photos/landing/background.webp`). */
export const MASTER_DEMO_FRAME_BG_SRC = '/photos/landing/background.webp';

export const masterDemoFrameBgClass = 'bg-cover bg-center bg-no-repeat';

export const masterDemoMediaFrame =
  `relative aspect-[4/5] w-full min-h-0 overflow-hidden rounded-[28px] ${masterDemoFrameBgClass} sm:aspect-auto sm:min-h-[580px] sm:rounded-[32px] lg:min-h-[660px] lg:rounded-[36px] xl:min-h-[720px]`;

export const masterDemoHeroPhoneFrame =
  `relative aspect-[4/5] w-full min-h-0 max-w-none overflow-hidden rounded-[28px] ${masterDemoFrameBgClass} sm:aspect-auto sm:min-h-[600px] sm:max-w-[1100px] sm:rounded-[50px] lg:min-h-[640px]`;

/** Компактная панель полей в демо — меньше padding, чем в кабинете. */
export const masterDemoFormPanel = 'overflow-hidden rounded-[14px] bg-white p-3 sm:rounded-[16px]';

export const masterDemoFieldActive = 'ring-2 ring-[#F47C8C]/35 bg-[#E4E4E4]';

export const masterDemoFieldActiveSchedule = 'ring-2 ring-[#3B4CCA]/35 bg-[#E4E4E4]';

export const masterDemoChipCabinet =
  'shrink-0 max-w-full rounded-full px-3 py-1.5 text-left text-[11px] font-semibold leading-snug transition sm:text-[12px]';

export const masterDemoChipCabinetIdle = 'bg-[#FFF1F4] text-[#111827]';

export const masterDemoChipCabinetActive = 'bg-[#F47C8C] text-white';

export const masterDemoCoverPlaceholder =
  'flex aspect-[4/3] w-full items-center justify-center rounded-[12px] bg-[#EBEBEB] text-[12px] font-semibold text-[#9CA3AF]';

export const masterDemoSegmentTrack =
  'grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5';

export function masterDemoSegmentClass(active: boolean, accent: 'brand' | 'schedule' = 'brand'): string {
  return `flex min-h-9 items-center justify-center text-center rounded-[10px] px-2 text-[11px] font-semibold leading-snug transition sm:min-h-10 sm:text-[12px] ${
    active
      ? accent === 'schedule'
        ? 'bg-[#3B4CCA] text-white'
        : 'bg-[#F47C8C] text-white'
      : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}
