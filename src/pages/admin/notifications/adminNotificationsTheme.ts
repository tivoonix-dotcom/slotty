import {
  catalogSheetPrimaryBtn,
} from '../shared/adminCatalogSheetTheme';
import {
  profileDashboardCard,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const NOTIFICATIONS_PAGE_BG = 'max-lg:bg-transparent';

export const NOTIFICATIONS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const notificationsDesktopCard = profileDashboardCard;

export const notificationsShellCard = 'hidden w-full min-w-0 lg:block';

/** Панель фильтров — вторичная, без карточки и бордеров. */
export const notifListToolbar = 'w-full min-w-0';

export const notifTrayLabel = 'text-[12px] font-medium text-[#9CA3AF]';

export const notifCardShell =
  'flex w-full overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] shadow-[0_1px_3px_rgba(17,24,39,0.03)] transition active:scale-[0.99] lg:rounded-[18px] lg:ring-[#EAECEF]';

export const notifCardShellInteractive =
  `${notifCardShell} cursor-pointer hover:bg-[#FAFAFA] hover:shadow-[0_4px_14px_rgba(17,24,39,0.06)] hover:ring-[#E8E8EC]`;

export const notifCardShellRead = 'bg-[#FAFAFA] ring-[#EEEEEE]';

export const notifCardShellUnread =
  'border-l-[3px] border-l-[#F47C8C] bg-[#FFFBFC] ring-[#FDE8ED] shadow-[0_2px_12px_rgba(244,124,140,0.08)]';

export const notifCardShellAction =
  'ring-[#FED7AA]/80';

export const notifCardBody = 'flex min-w-0 flex-1';

export const notifIconStrip =
  'flex w-[4.25rem] shrink-0 items-center justify-center self-stretch py-3 sm:w-[4.75rem]';

export const notifIconStripUnread = 'bg-[#FFF1F4]';

export const notifIconStripRead = 'bg-[#EBEBEB]';

export const notifCardContent = 'min-w-0 flex-1 p-3.5 sm:p-4';

export const notifBadgeNew =
  'rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]';

export const notifKpiIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]';

export const notifHeroSubtitle = 'mt-1.5 text-[14px] font-medium leading-snug text-[#6B7280]';

export const notifHeroActions =
  'flex flex-wrap items-center gap-2 sm:gap-3';

export const notifHeroActionLink =
  'inline-flex min-h-9 items-center justify-center rounded-[10px] bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const notifHeroActionMuted =
  'inline-flex min-h-9 items-center justify-center rounded-[10px] bg-[#F5F5F5] px-3.5 text-[13px] font-semibold text-[#374151] ring-1 ring-[#EEEEEE] transition hover:bg-[#EBEBEB] active:scale-[0.98]';

export const notifFilterScroll =
  'flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:pb-0';

/** KPI в шапке уведомлений: на мобилке — горизонтальная лента без полосы прокрутки. */
export const notifKpiScroll =
  'flex gap-2.5 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:snap-none';

export const notifKpiScrollItem = 'w-[10.25rem] shrink-0 snap-start lg:w-auto lg:shrink';

export const notifFilterChip =
  'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition active:scale-[0.98]';

export const notifFilterChipActive = 'bg-[#FFF1F4] text-[#F47C8C]';

export const notifFilterChipIdle =
  'text-[#9CA3AF] hover:bg-[#F5F5F5] hover:text-[#6B7280]';

export const notifFilterBadgeActive = 'text-[11px] font-semibold tabular-nums text-[#F47C8C]/80';

export const notifFilterBadgeIdle = 'text-[11px] font-medium tabular-nums text-[#C4C4C4]';

export const notifTimeGroupLabel =
  'text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]';

export const notifCardMetaChip =
  'inline-flex max-w-full items-center truncate rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280]';

export const notifCardActionBtn =
  'inline-flex shrink-0 items-center justify-center rounded-[10px] border-0 bg-[#FFF1F4] px-3 py-2 text-[12px] font-bold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const notifCardActionBtnRead =
  'inline-flex shrink-0 items-center justify-center rounded-[10px] border-0 bg-[#F5F5F5] px-3 py-2 text-[12px] font-semibold text-[#6B7280] transition hover:bg-[#EBEBEB] active:scale-[0.98]';

/** CTA для прочитанных, но ещё требующих ответа (например отзыв без reply). */
export const notifCardActionBtnAttention =
  'inline-flex shrink-0 items-center justify-center rounded-[10px] border-0 bg-[#FFF1F4] px-3 py-2 text-[12px] font-bold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const notifBadgeRead =
  'rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#9CA3AF]';

export const notifUnreadDot = 'h-2.5 w-2.5 shrink-0 rounded-full bg-[#F47C8C] ring-2 ring-[#FFFBFC]';

export const notifSkeletonBar = 'rounded-[8px] bg-[#EBEBEB]';

export const notifSkeletonShimmer = 'animate-pulse';

export const notifDetailSticker =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]';

export const notifDetailNarrative = 'text-[15px] font-medium leading-relaxed text-[#374151]';

/** Панели деталей — мягкий фон без бордеров (стиль кабинета SLOTTY). */
export const notifDetailInsetPanel = 'rounded-[16px] bg-[#F5F5F5] px-4 py-4';

export const notifDetailInsetRow = 'flex items-start justify-between gap-4';

export const notifDetailContextCard = notifDetailInsetPanel;

export const notifDetailContextRow = notifDetailInsetRow;

export const notifDetailSectionTitle =
  'text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]';

export const notifDetailHighlight = 'rounded-[16px] bg-[#FFF1F4] px-4 py-4';

export const notifDetailReviewQuote = 'rounded-[16px] bg-white px-4 py-4';

export const notifIconFallback =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]';

export const notifPinkBtn = catalogSheetPrimaryBtn;

/** Компактные CTA в футере drawer уведомлений — не на всю ширину. */
export const notifFooterPrimary =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#F47C8C] px-4 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const notifFooterSecondary =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#F6F7FB] px-4 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.98] disabled:opacity-50';

export const notifFooterDanger =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#FEF2F2] px-4 text-[14px] font-semibold text-[#EF4444] transition hover:bg-[#FEE2E2] active:scale-[0.98] disabled:opacity-50';

export const notifFooterDismiss =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-[12px] px-3 text-[14px] font-semibold text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#111827] active:scale-[0.98] disabled:opacity-50';

export const notifEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EBEBEB] text-[#6B7280]';

export const notifMetaAccent = 'font-semibold text-[#F47C8C]';

export const notifErrorBox =
  'rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-center text-[14px] font-semibold text-[#EF4444]';

export const notifLoadingCard =
  'flex min-h-[12rem] items-center justify-center rounded-[16px] bg-white py-10 ring-1 ring-[#EEEEEE]';

/** Баннер на профиле — белая карточка кабинета. */
export const notifProfileBanner =
  'mb-4 flex items-start gap-3 rounded-[16px] bg-white px-4 py-3.5 ring-1 ring-[#EEEEEE] transition active:scale-[0.99] hover:bg-[#FAFAFA]';

/** @deprecated */
export const notifListTray = notifListToolbar;

/** @deprecated */
export const notifCard = notifCardShell;
