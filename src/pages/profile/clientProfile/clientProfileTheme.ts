import {
  catalogDesktopPanel,
  catalogCanvasClass,
  catalogDesktopSectionLabel,
  catalogDesktopChipActive,
  catalogDesktopChipIdle,
  catalogSectionTabActive,
  catalogSectionTabIdle,
  catalogViewTabActive,
  catalogViewTabIdle,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogDesktopShellClass,
  catalogPanelListClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
} from '../../client/servicesCatalog/servicesCatalogTheme';

export {
  catalogCanvasClass,
  catalogDesktopPanel,
  catalogDesktopSectionLabel,
  catalogDesktopChipActive,
  catalogDesktopChipIdle,
  catalogSectionTabActive,
  catalogSectionTabIdle,
  catalogViewTabActive,
  catalogViewTabIdle,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogDesktopShellClass,
  catalogPanelListClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
};

export const clientProfileSidebarWidth =
  'lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]';

export const clientProfileSectionTitle =
  'text-[22px] font-bold tracking-[-0.03em] text-[#111827]';

export const clientProfileSubTabTrack = 'flex shrink-0 rounded-[10px] bg-[#EBEBEB] p-1';

export const clientProfileSubTabActive =
  'bg-white text-[#111827] font-semibold shadow-[0_1px_3px_rgba(17,24,39,0.06)]';

export const clientProfileSubTabIdle =
  'font-medium text-[#6B7280] transition hover:text-[#111827]';

export const clientProfileMutedPanel = 'rounded-[12px] bg-[#F5F5F5]';

/** Белая панель кабинета: на мобиле — обводка как в кабинете мастера. */
export const clientCabinetMobilePanel = `${catalogDesktopPanel} max-lg:overflow-hidden max-lg:ring-1 max-lg:ring-[#EEEEEE]`;

export const clientProfileEditBtn =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F47C8C] px-4 text-[13px] font-semibold text-white transition hover:bg-[#F36B85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C8C]/50';
