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

/** Секции формы на сером полотне каталога — без белой карточки с тенью. */
export const adminFormSheetSectionCatalog = 'space-y-4';

export const adminFormSheetSectionTitleCatalog =
  'text-[15px] font-bold tracking-[-0.03em] text-[#111827]';

export const adminFormSheetSectionHintCatalog =
  'mt-1 text-[13px] font-medium leading-relaxed text-[#6B7280]';

export const adminFormSheetMetricCatalog =
  'rounded-[10px] bg-[#EBEBEB] px-4 py-3.5';

/** `public/photos/badges/check.webp` — пройденный шаг в степпере форм. */
export const adminFormSheetStepDoneIconSrc = '/photos/badges/check.webp';
