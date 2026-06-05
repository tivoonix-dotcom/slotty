import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';

export const settingsCanvasClass = 'bg-[#F5F5F5]';

/** Белая карточка без внешней рамки — как OKX */
export const settingsCardClass = 'overflow-hidden rounded-[16px] bg-white';

export const settingsCardInnerDivider = 'divide-y divide-[#EBEBEB]';

export const settingsSectionTitleClass =
  'mb-3 text-[18px] font-bold tracking-[-0.02em] text-[#111827]';

export const settingsRowClass =
  'flex items-center gap-4 px-5 py-4 transition hover:bg-[#FAFAFA]';

export const settingsRowIconClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#111827]';

export const settingsRowActionClass =
  'shrink-0 rounded-[10px] bg-[#F5F5F5] px-4 py-2 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.98] disabled:opacity-50';

export const settingsPrimaryBtnClass =
  'inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#111827] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1F2937] active:scale-[0.98]';

export const settingsSecondaryBtnClass =
  'inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#F5F5F5] px-5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.98]';

export const settingsWorkspaceBg = 'bg-[#f6f7fb]';

export const settingsSidebarShellClass =
  'shrink-0 rounded-[20px] border border-[#EAECEF] bg-white p-3 shadow-[0_4px_24px_rgba(17,24,39,0.04)] lg:w-[260px] xl:w-[280px]';

export const clientSettingsNavGroupLabel =
  'px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] first:pt-1';

export const clientSettingsNavItemClass = (active: boolean): string =>
  `flex min-h-[40px] w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/35 ${
    active
      ? 'bg-[#FFF1F4] text-[#ff5f7a]'
      : 'text-[#374151] hover:bg-[#F7F7F8] hover:text-[#111827]'
  }`;

export const settingsDocSidebarLinkClass =
  'block rounded-[8px] px-3 py-2 text-[14px] text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827]';

export const settingsDocSidebarLinkActiveClass =
  'block rounded-[8px] bg-[#FAFAFA] px-3 py-2 text-[14px] font-bold text-[#111827]';

export const settingsLayoutGridClass =
  'flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:gap-8';

export const settingsDesktopShellClass = `${CLIENT_DESKTOP_SHELL_CLASS} pb-10 pt-6`;

export const settingsCardSurfaceClass =
  'rounded-[20px] border border-[#EAECEF] bg-white shadow-[0_4px_24px_rgba(17,24,39,0.05)]';

export const settingsContentClass = 'min-w-0 flex-1';
