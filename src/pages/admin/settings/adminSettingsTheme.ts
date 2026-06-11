import { profileCabinetPanel, PROFILE_DESKTOP_PAGE_BG } from '../profile/adminProfileDashboardTheme';

export const SETTINGS_PAGE_BG = 'bg-white';

export const SETTINGS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const settingsShellCard = `${profileCabinetPanel} w-full min-w-0 space-y-5 p-4 sm:p-5 lg:p-6`;

export const settingsPanel = 'min-w-0 space-y-8';

export const settingsSectionLabel =
  'text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]';

export const settingsListTray = 'overflow-hidden rounded-[16px] bg-[#f6f7fb] lg:bg-[#FAFAFA]';

export const settingsListDivide = 'divide-y divide-[#EEEEEE]';

export const settingsRow =
  'flex w-full items-center gap-3 border-0 bg-transparent px-4 py-4 text-left transition hover:bg-[#FAFAFA] active:opacity-90';

export const settingsRowIcon =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#ff5f7a] ring-1 ring-[#EAECEF] lg:bg-white';

export const settingsPrimaryBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[14px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]';

export const settingsOutlineBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] border border-[#EAECEF] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98]';

export const settingsBackBtn =
  'inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#ff5f7a] active:scale-[0.98]';

export const settingsLegalArticle = 'min-w-0 space-y-4 pt-2';

/** Фон шапки вкладки «Справка» (`public/photos/hero.webp`, poster главной). */
export const SETTINGS_HELP_HERO_BG = '/photos/hero.webp';

/** Вытягивание hero на края белой карточки настроек (см. `settingsShellCard` padding). */
export const settingsHelpHeroBleed = '-mx-4 sm:-mx-5 lg:-mx-6';
