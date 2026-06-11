/** Карточка отзыва — мягкая панель без ring/border (как уведомления). */
export const repReviewCard = 'rounded-[18px] bg-[#F5F5F5] p-4';

export const repReviewAuthor = 'text-[16px] font-bold tracking-[-0.03em] text-[#111827]';

export const repReviewDate = 'shrink-0 text-[12px] font-medium tabular-nums text-[#9CA3AF]';

export const repReviewQuote = 'mt-3 rounded-[14px] bg-white px-3.5 py-3.5';

export const repReviewQuoteText = 'text-[14px] font-medium leading-relaxed text-[#374151]';

export const repReviewSectionLabel =
  'text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]';

export const repReplyWrap = 'mt-3 space-y-2.5';

export const repReplyTextarea =
  'w-full min-h-[5.5rem] resize-none rounded-[12px] border-0 bg-[#EBEBEB] px-4 py-3 text-[14px] font-medium leading-relaxed text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[#FFF1F4]';

export const repReplyBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#F47C8C] px-4 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const repMasterReplyPanel = 'mt-3 rounded-[14px] bg-[#ECFDF5] px-3.5 py-3.5';

export const repMasterReplyText = 'mt-1.5 text-[14px] font-medium leading-relaxed text-[#374151]';

export const repFilterChip =
  'rounded-full px-3 py-1.5 text-[12px] font-semibold transition active:scale-[0.98]';

export function repFilterChipClass(
  active: boolean,
  tone: 'unanswered' | 'all' | 'good' | 'poor',
): string {
  if (!active) return `${repFilterChip} text-[#9CA3AF] hover:bg-[#F5F5F5] hover:text-[#6B7280]`;
  if (tone === 'good') return `${repFilterChip} bg-[#ECFDF5] text-[#059669]`;
  if (tone === 'all') return `${repFilterChip} bg-[#F6F7FB] text-[#111827]`;
  if (tone === 'unanswered') return `${repFilterChip} bg-[#FFF1F4] text-[#F47C8C]`;
  return `${repFilterChip} bg-[#FFF7ED] text-[#D97706]`;
}

export const repEmptyList = 'rounded-[16px] bg-[#F5F5F5] px-4 py-10 text-center text-[14px] font-medium text-[#6B7280]';

/** Фон подсказки «Вежливый ответ…» (`public/photos/visit-complete/1.webp`). */
export const repReplyHintBg = '/photos/visit-complete/1.webp';

export const repAlertBanner =
  'rounded-[16px] bg-[#FFF7ED] px-4 py-3.5';
