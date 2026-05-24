import {
  adminSheetInsetTray,
  adminSheetSectionCard,
  adminSheetGhostBtn,
  adminSheetSecondaryBtn,
  adminSheetKpiTile,
} from './adminCabinetSheetTheme';

export const adminFormSheetSection = `${adminSheetSectionCard} p-5 lg:p-6`;

export const adminFormSheetSectionTitle =
  'text-[17px] font-black tracking-[-0.04em] text-[#111827] lg:text-[20px] lg:tracking-[-0.05em]';

export const adminFormSheetSectionHint =
  'mt-1 text-[13px] font-semibold leading-relaxed text-[#6B7280] lg:text-[14px]';

export const adminFormSheetHighlight = adminSheetKpiTile;

export const adminFormSheetSuccessHighlight =
  'rounded-[22px] bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] p-5 shadow-[0_4px_16px_rgba(22,163,74,0.08)] ring-1 ring-[#BBF7D0] lg:p-6';

export const adminFormSheetInsetTray = adminSheetInsetTray;

export const adminFormSheetGhostBtn = adminSheetGhostBtn;

export const adminFormSheetSecondaryBtn = adminSheetSecondaryBtn;
