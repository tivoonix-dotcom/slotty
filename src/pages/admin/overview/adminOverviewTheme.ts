/** Палитра и классы экрана «Сводка». */
import { SERVICES_PAGE_BG } from '../services/adminServicesTheme';

/** Фон страницы — как у «Услуг» и других разделов с карточками. */
export const OVERVIEW_CANVAS_HEX = '#FFFFFF';
export const overviewPageBg = SERVICES_PAGE_BG;
export const overviewInsetBg = 'bg-[#F3F4F6]';

/** Высота нижнего таббара аналитики. */
export const OVERVIEW_TAB_BAR_HEIGHT = '5.75rem';

export const ADMIN_CABINET_SHELL_MAX = 'w-full max-w-[460px] lg:max-w-none';

export const overviewCard =
  'rounded-[24px] border border-white/80 bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)]';

export const overviewCardPad = 'p-[18px]';

export const overviewIconCircle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C] shadow-[0_8px_20px_rgba(244,124,140,0.10)]';

export const overviewPinkBtn =
  'rounded-[18px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-white shadow-[0_10px_26px_rgba(244,124,140,0.30)] transition hover:brightness-[0.98] active:scale-[0.98]';

export const overviewPinkOutline =
  'shrink-0 rounded-[18px] border border-[#FDE8ED] bg-white px-4 py-2.5 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.98]';

export const overviewMutedSurface =
  'rounded-[20px] border border-[#EAECEF] bg-[#F3F4F6]';

export const overviewEmptyIllustrationSrc =
  '/photos/' + encodeURIComponent('ничего не нашли.webp');

const overviewSvodkaDir = '/photos/' + encodeURIComponent('сводка') + '/';

/** Иллюстрации для шапок табов «Сводка». */
export function overviewSvodkaPhotoSrc(fileName: string): string {
  return overviewSvodkaDir + encodeURIComponent(fileName);
}

/** Декор внизу вкладки «Клиенты» (после графика). */
export const OVERVIEW_CLIENTS_FOOTER_SRC = '/photos/KLIENT.webp';