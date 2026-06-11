import { profileCabinetPanel } from './adminProfileDashboardTheme';

const landingPhotosDir = `/photos/${encodeURIComponent('лендинг')}/`;

/** Фон hero-блока заполненности (`public/photos/лендинг/заднийфон.png`). */
export const PROFILE_COMPLETION_HERO_BG = `${landingPhotosDir}${encodeURIComponent('заднийфон.png')}`;

export const profileCompletionHeroPanel = 'relative overflow-hidden rounded-[16px]';

export const profileCompletionHeroOverlay =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-white/78 via-white/52 to-white/72';

/** Заполненность профиля — плоский стиль как OKX-каталог: без теней и бордеров. */

export const profileCompletionPanel = profileCabinetPanel;

export const profileCompletionList = 'divide-y divide-[#EEEEEE]';

export const profileCompletionRowPad = 'px-5 py-4 sm:px-6 sm:py-4';

export const profileCompletionMetaChip =
  'inline-flex rounded-[8px] bg-[#F0F0F0] px-2.5 py-1 text-[13px] font-medium text-[#374151]';

export const profileCompletionPrimaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]';

export const profileCompletionSecondaryBtn =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-4 text-[13px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98]';

export const profileCompletionDoneBadge =
  'shrink-0 text-[13px] font-semibold text-[#16A34A]';

export const profileCompletionSectionLabel =
  'text-[13px] font-medium text-[#8E8E93]';
