export const APPOINTMENTS_PAGE_BG = 'bg-[#F7F7F8]';

export const APPOINTMENTS_TAB_BAR_HEIGHT = '5.75rem';
export const APPOINTMENTS_TAB_BAR_SCROLL_PAD = `calc(${APPOINTMENTS_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const apptCard =
  'rounded-[22px] border border-[#EAECEF] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.05)]';

export const apptPinkBtn =
  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(244,124,140,0.28)] transition hover:brightness-[0.98] active:scale-[0.98] disabled:opacity-50';

export const apptOutlineBtn =
  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[16px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:border-[#FDE8ED] hover:bg-[#FAFAFA] active:scale-[0.98]';

export const apptChip =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const apptChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]';

export const apptChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';
