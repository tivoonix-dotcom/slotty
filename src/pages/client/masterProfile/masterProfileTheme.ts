import { catalogStickyToolbarClass } from '../servicesCatalog/servicesCatalogTheme';

export {
  catalogCanvasClass,
  catalogDesktopPanel,
  catalogDesktopSectionLabel,
  catalogPanelListClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogStickyToolbarClass,
} from '../servicesCatalog/servicesCatalogTheme';

export const masterProfileMobileToolbarStickyClass = `${catalogStickyToolbarClass} pb-2 pt-1`;

export const masterProfileDesktopGrid =
  'xl:grid-cols-[minmax(0,1fr)_360px]';

export const masterProfileSectionTitle =
  'text-[22px] font-bold tracking-[-0.03em] text-[#111827]';

export const masterProfileMutedPanel = 'rounded-[12px] bg-[#F5F5F5]';

/** Правая панель client-sheet на desktop (детали услуги). */
export const clientDesktopDrawerPanel =
  'lg:w-[min(480px,42vw)] lg:min-w-[400px] lg:max-w-[520px]';

/** Шире — запись / календарь. */
export const clientDesktopDrawerPanelWide =
  'lg:w-[min(560px,46vw)] lg:min-w-[480px] lg:max-w-[600px]';
