/** Токены SaaS workspace «Настройки» кабинета мастера. */
export const SETTINGS_WORKSPACE_BG = 'bg-[#f6f7fb]';

export const SETTINGS_RAIL_WIDTH_EXPANDED = 'w-[72px]';
export const SETTINGS_RAIL_WIDTH_COLLAPSED = 'w-[72px]';

export const SETTINGS_SIDEBAR_WIDTH = 'w-[280px]';

export const settingsCardClass =
  'rounded-[20px] border border-[#EAECEF] bg-white shadow-[0_4px_24px_rgba(17,24,39,0.05)]';

export const settingsPinkBtn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const settingsOutlineBtn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-[#EAECEF] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:opacity-50';

export const settingsDangerBtn =
  'inline-flex min-h-10 items-center justify-center rounded-[12px] border border-[#FECACA] bg-white px-4 text-[14px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] active:scale-[0.98] disabled:opacity-50';

export const settingsNavGroupLabel =
  'px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] first:pt-2';

export const settingsNavItemClass = (active: boolean): string =>
  `flex min-h-[40px] w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/35 ${
    active
      ? 'bg-[#FFF1F4] text-[#ff5f7a]'
      : 'text-[#374151] hover:bg-[#F7F7F8] hover:text-[#111827]'
  }`;

export const settingsRailItemClass = (active: boolean): string =>
  `relative flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/35 ${
    active ? 'bg-[#FFF1F4] text-[#ff5f7a]' : 'text-[#6B7280] hover:bg-[#F7F7F8] hover:text-[#111827]'
  }`;
