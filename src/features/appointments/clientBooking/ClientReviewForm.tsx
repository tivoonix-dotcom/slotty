import { HiStar } from 'react-icons/hi2';
import {
  REVIEW_TAG_OPTIONS,
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
} from './clientReviewFlow';
import { CLIENT_REVIEW_HERO_BG } from './clientBookingDetailUi';

type Props = {
  masterName: string;
  serviceTitle: string;
  rating: number;
  onRatingChange: (value: number) => void;
  text: string;
  onTextChange: (value: string) => void;
  tags: string[];
  onToggleTag: (tag: string) => void;
  submitError: string | null;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  showTags?: boolean;
  submitLabel?: string;
  compact?: boolean;
};

export function ClientReviewForm({
  masterName,
  serviceTitle,
  rating,
  onRatingChange,
  text,
  onTextChange,
  tags,
  onToggleTag,
  submitError,
  submitting,
  canSubmit,
  onSubmit,
  showTags = true,
  submitLabel = 'Отправить отзыв',
  compact = false,
}: Props) {
  const textOk = text.trim().length >= REVIEW_TEXT_MIN;

  return (
    <div
      className={`overflow-hidden bg-white ${compact ? 'rounded-t-[28px]' : 'rounded-[22px] shadow-[0_8px_40px_rgba(17,24,39,0.06)] ring-1 ring-[#EEEEEE]'}`}
    >
      <div className="relative h-28 overflow-hidden sm:h-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${CLIENT_REVIEW_HERO_BG})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white/55 to-white"
          aria-hidden
        />
      </div>
      <div className="border-b border-[#F3F4F6] bg-white px-5 pb-5 pt-4 text-center sm:px-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.055em] text-[#111827] sm:text-[28px]">
          Оставить отзыв
        </h1>
        <p className="mt-2 text-[15px] font-medium leading-snug text-[#374151]">
          {masterName} · {serviceTitle}
        </p>
      </div>

      <div className="space-y-5 px-5 pb-6 sm:px-6 sm:pb-7">
        <div>
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Оценка
          </p>
          <div className="mt-3 flex justify-center gap-1 sm:gap-1.5" role="group" aria-label="Оценка от 1 до 5">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onRatingChange(n)}
                  className="rounded-lg p-1.5 transition active:scale-95 hover:bg-[#FFFBEB]/80"
                  aria-label={`${n} из 5`}
                  aria-pressed={active}
                >
                  <HiStar
                    className={`h-10 w-10 sm:h-11 sm:w-11 ${
                      active ? 'fill-amber-400 text-amber-400' : 'text-[#E5E7EB]'
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
          {rating > 0 ? (
            <p className="mt-2 text-center text-[13px] font-semibold text-amber-600">
              {rating} из 5
            </p>
          ) : (
            <p className="mt-2 text-center text-[13px] text-neutral-400">Нажмите на звезду</p>
          )}
        </div>

        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Текст отзыва
          </span>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value.slice(0, REVIEW_TEXT_MAX))}
            rows={4}
            placeholder="Как прошла услуга?"
            className="mt-2 w-full resize-none rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-[15px] leading-relaxed text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 focus:bg-[#EBEBEB]"
          />
          <p className="mt-1.5 text-[12px] text-neutral-400">
            {textOk
              ? `${text.trim().length} / ${REVIEW_TEXT_MAX}`
              : `Минимум ${REVIEW_TEXT_MIN} символов · ${text.trim().length} / ${REVIEW_TEXT_MAX}`}
          </p>
        </label>

        {showTags ? (
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Что понравилось
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {REVIEW_TAG_OPTIONS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                      active
                        ? 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#F47C8C]/30'
                        : 'bg-[#F1EFEF] text-[#374151] hover:bg-[#EBEBEB]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {submitError ? (
          <p className="rounded-[14px] bg-[#FEF2F2] px-4 py-3 text-center text-[14px] font-semibold text-[#EF4444]">
            {submitError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Отправляем…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
