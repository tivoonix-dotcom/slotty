import { profileCabinetPanel, PROFILE_DESKTOP_PAGE_BG } from '../profile/adminProfileDashboardTheme';

export { homePinkBtn, homeOutlineBtn } from '../../home/homeTheme';

export const BILLING_PAGE_BG = 'bg-white';

export const BILLING_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const billingDesktopCard = profileCabinetPanel;

export const billingShellCard = 'hidden w-full min-w-0 lg:block';

export const billingListTray =
  'rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE] lg:p-5';

export const billingPanel = 'rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5';

export const billingPlanCard =
  'relative flex min-h-[20rem] flex-col overflow-hidden rounded-[22px] border border-[#E8EAED] bg-white p-5 shadow-[0_8px_30px_rgba(17,24,39,0.04)]';

export const billingPlanCardActive = 'border-[#111827] ring-1 ring-[#111827]/10';

export const billingCheckIcon =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]';

export const billingPinkBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] bg-[#111827] text-[14px] font-semibold text-white transition hover:bg-[#2d2d2d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const billingOutlineBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:cursor-default disabled:opacity-70';

export const billingSegmentWrap = 'grid grid-cols-2 gap-1 rounded-[12px] bg-[#EBEBEB] p-1';

export const billingSegmentBtn = (active: boolean) =>
  `flex min-h-10 w-full items-center justify-center rounded-[10px] text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-white text-[#111827] shadow-[0_2px_8px_rgba(17,17,17,0.06)]'
      : 'bg-transparent text-[#6B7280] hover:text-[#374151]'
  }`;

export const billingTrayLabel =
  'mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]';

export const billingErrorBanner =
  'rounded-[18px] border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]';

export const billingSoftNote =
  'rounded-[18px] bg-[#F9FAFB] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#6B7280] ring-1 ring-[#F3F4F6]';

/** SaaS-строка в карточке подписки: заголовок слева, pill-кнопка справа. */
export const billingSaasSectionTitle = 'text-[15px] font-bold tracking-[-0.02em] text-[#111827]';

export const billingSaasSectionHint = 'mt-0.5 text-[13px] font-medium leading-snug text-[#6B7280]';

export const billingSaasRowDivider = 'border-b border-[#EEEEEE]';

export const billingSaasPillBtn =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-[#EAECEF] bg-white px-4 text-[13px] font-semibold text-[#111827] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const billingSaasPillBtnDanger =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-[#FECACA] bg-white px-4 text-[13px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const billingSaasPillBtnPrimary =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-[#111827] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2d2d2d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const billingSaasMethodCard =
  'flex items-center gap-3 rounded-[14px] bg-[#F9FAFB] px-4 py-3 ring-1 ring-[#F3F4F6]';

export const billingSaasStatusActive =
  'rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold text-[#047857] ring-1 ring-[#A7F3D0]';

export const billingSaasStatusMuted =
  'rounded-full bg-[#F3F4F6] px-3 py-1 text-[12px] font-semibold text-[#6B7280] ring-1 ring-[#E5E7EB]';

/** @deprecated use billingPanel */
export const billingLandingPanel = billingPanel;

/** @deprecated use billingPlanCard */
export const billingLandingCard = billingPlanCard.replace(' p-5', '');
