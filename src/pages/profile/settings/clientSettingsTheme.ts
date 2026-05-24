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

export const settingsSidebarClass =
  'flex shrink-0 flex-col gap-0.5 lg:w-[220px] xl:w-[240px]';

export const settingsSidebarLinkClass =
  'rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-[#6B7280] transition hover:bg-white/80 hover:text-[#111827]';

export const settingsSidebarLinkActiveClass =
  'rounded-[8px] bg-white px-3 py-2.5 text-[14px] font-bold text-[#111827] shadow-sm';

export const settingsDocSidebarLinkClass =
  'block rounded-[8px] px-3 py-2 text-[14px] text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827]';

export const settingsDocSidebarLinkActiveClass =
  'block rounded-[8px] bg-[#FAFAFA] px-3 py-2 text-[14px] font-bold text-[#111827]';

export const settingsLayoutGridClass =
  'flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-8';

export const settingsDesktopShellClass = `${CLIENT_DESKTOP_SHELL_CLASS} pb-10 pt-6`;

export const settingsContentClass = 'min-w-0 flex-1';
