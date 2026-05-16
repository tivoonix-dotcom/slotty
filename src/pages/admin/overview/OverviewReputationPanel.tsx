import { useCallback, useMemo, useRef, useState } from 'react';
import {
  HiArrowTrendingUp,
  HiChatBubbleLeftRight,
  HiChevronRight,
  HiStar,
} from 'react-icons/hi2';
import { overviewPinkBtn } from './adminOverviewTheme';
import { OverviewRatingChart } from './OverviewRatingChart';
import {
  computeReputationFromReviews,
  trySaveMasterReviewReply,
  type MasterOverviewReview,
} from './overviewReputationDemo';
import { formatReviewDayMonthRu } from './overviewFormat';
import {
  OverviewCompactMetricCard,
  OverviewEmptyState,
  OverviewMetricCard,
  OverviewSectionCard,
  OverviewWideMetricCard,
} from './OverviewSharedUi';

function reviewsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} отзывов`;
  if (mod10 === 1) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`;
  return `${n} отзывов`;
}

function RatingStars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5 text-[#FBBF24]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar key={i} className={`h-5 w-5 ${i <= rounded ? 'opacity-100' : 'opacity-25'}`} />
      ))}
    </div>
  );
}

function TrendSub({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-[#9CA3AF]">без изменений</span>;
  const sign = delta > 0 ? '+' : '';
  return (
    <span className={delta > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
      {sign}
      {delta} к прошлому периоду
    </span>
  );
}

function ReviewReplyBlock({
  review,
  onReplied,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  if (review.masterReply) {
    return (
      <div className="mt-3 rounded-[16px] border border-[#FDE8ED] bg-[#FFF9FB] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#F47C8C]">Ваш ответ</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#374151]">{review.masterReply}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
        }}
        rows={3}
        placeholder="Напишите ответ клиенту…"
        className="w-full resize-none rounded-[14px] border border-[#F3F4F6] bg-[#FAFAFA] px-3 py-2.5 text-[13px] text-[#111827] outline-none ring-[#F47C8C] placeholder:text-[#9CA3AF] focus:border-[#F9A8B4] focus:ring-2"
      />
      {error ? <p className="text-[12px] font-medium text-[#EF4444]">{error}</p> : null}
      <button
        type="button"
        disabled={!text.trim()}
        className={`${overviewPinkBtn} w-full disabled:cursor-not-allowed disabled:opacity-45`}
        onClick={() => {
          const result = trySaveMasterReviewReply(review.id, text);
          if (!result.ok) {
            if (result.reason === 'already_replied') {
              setError('На этот отзыв уже можно ответить только один раз.');
            } else {
              setError('Не удалось отправить ответ.');
            }
            onReplied();
            return;
          }
          setText('');
          onReplied();
        }}
      >
        Ответить
      </button>
    </div>
  );
}

function ReviewCard({
  review,
  onReplied,
  showReply = true,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  showReply?: boolean;
}) {
  return (
    <article className="rounded-[20px] border border-[#F3F4F6] bg-[#FAFAFA] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F9A8B4] to-[#F47C8C] text-[15px] font-bold text-white">
          {review.authorInitial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-[#111827]">{review.author}</p>
            <p className="text-[12px] font-medium text-[#9CA3AF]">
              {formatReviewDayMonthRu(review.dateIso)}
            </p>
          </div>
          <div className="mt-1">
            <RatingStars value={review.rating} />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{review.text}</p>
        </div>
      </div>
      {showReply ? <ReviewReplyBlock review={review} onReplied={onReplied} /> : null}
    </article>
  );
}

export function OverviewReputationPanel({
  periodStart,
  periodEnd,
}: {
  periodStart: string;
  periodEnd: string;
}) {
  const unansweredRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const data = useMemo(() => {
    void tick;
    return computeReputationFromReviews(periodStart, periodEnd);
  }, [periodEnd, periodStart, tick]);

  const unansweredExceptLatest = useMemo(() => {
    const latestId = data.latestReview?.id;
    return data.unansweredList.filter((r) => r.id !== latestId);
  }, [data.latestReview?.id, data.unansweredList]);

  if (!data.hasReviews) {
    return (
      <div className="min-w-0 space-y-4 overflow-x-hidden">
        <OverviewEmptyState
          icon={<HiStar className="h-7 w-7" aria-hidden />}
          title="Отзывов пока нет"
          text="После первых отзывов здесь появится рейтинг мастера и аналитика репутации."
        />

        <OverviewSectionCard
          title="Репутация"
          subtitle="Здесь будут рейтинг, новые отзывы и отзывы без ответа"
          icon={<HiStar className="h-5 w-5" aria-hidden />}
        >
          <div className="grid min-w-0 grid-cols-2 gap-2.5">
            <OverviewMetricCard
              icon={<HiStar className="h-5 w-5" aria-hidden />}
              label="Рейтинг"
              value="Новый"
              sub="пока нет оценок"
            />
            <OverviewMetricCard
              icon={<HiStar className="h-5 w-5" aria-hidden />}
              label="Отзывы"
              value="0"
              sub="за всё время"
            />
          </div>
        </OverviewSectionCard>
      </div>
    );
  }

  const average = data.averageRating ?? 0;
  const trendBadge =
    data.ratingTrendPercent !== null && data.ratingTrend === 'up' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#10B981]">
        <HiArrowTrendingUp className="h-3.5 w-3.5" aria-hidden />+{data.ratingTrendPercent}%
      </span>
    ) : null;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <OverviewWideMetricCard
        icon={<HiStar className="h-7 w-7" aria-hidden />}
        label="Средний рейтинг"
        value={average.toFixed(1)}
        sub={`На основе ${reviewsCountLabel(data.reviewsCount)}`}
        badge={<RatingStars value={average} />}
      />

      <div className="grid min-w-0 grid-cols-2 gap-2.5">
        <OverviewCompactMetricCard
          icon={<HiChatBubbleLeftRight className="h-[18px] w-[18px]" aria-hidden />}
          label="Всего отзывов"
          value={String(data.reviewsCount)}
          sub={<TrendSub delta={data.totalReviewsDelta} />}
        />
        <OverviewCompactMetricCard
          icon={<HiChatBubbleLeftRight className="h-[18px] w-[18px]" aria-hidden />}
          label="Новые отзывы"
          value={String(data.newReviewsInPeriod)}
          sub={<TrendSub delta={data.newReviewsDelta} />}
          valueClassName="text-[#111827]"
        />
      </div>

      {data.unansweredReviews > 0 ? (
        <button
          type="button"
          className="flex w-full min-w-0 items-center justify-between gap-3 rounded-[24px] border border-[#F3F4F6] bg-white p-4 text-left shadow-[0_8px_24px_rgba(17,24,39,0.05)] transition hover:border-[#FDE8ED]"
          onClick={() =>
            unansweredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        >
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#6B7280]">Отзывы без ответа</p>
            <p className="mt-1 text-[28px] font-bold tracking-[-0.06em] text-[#111827]">
              {data.unansweredReviews}
            </p>
            <p className="mt-1 text-[12px] text-[#6B7280]">Ответьте, чтобы улучшить рейтинг</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiChevronRight className="h-5 w-5" aria-hidden />
          </span>
        </button>
      ) : null}

      <OverviewSectionCard
        title="Динамика рейтинга"
        subtitle={
          data.ratingDelta !== null
            ? `${data.ratingDelta >= 0 ? '+' : ''}${data.ratingDelta.toFixed(1)} к прошлому периоду`
            : 'Средний рейтинг по дням'
        }
        icon={<HiStar className="h-5 w-5" aria-hidden />}
        action={trendBadge}
      >
        <OverviewRatingChart stats={data.ratingByDay} />
        {data.chartIsTruncated ? (
          <p className="mt-3 text-[11px] leading-snug text-[#9CA3AF]">
            График показывает последние 90 дней, итоги — за выбранный период.
          </p>
        ) : null}
      </OverviewSectionCard>

      {data.latestReview ? (
        <OverviewSectionCard
          title="Последний отзыв"
          subtitle="Ответ можно отправить только один раз"
          icon={<HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />}
        >
          <ReviewCard review={data.latestReview} onReplied={refresh} />
        </OverviewSectionCard>
      ) : null}

      {unansweredExceptLatest.length > 0 ? (
        <div ref={unansweredRef}>
          <OverviewSectionCard
            title="Без ответа"
            subtitle="Ответьте на отзывы — повторный ответ недоступен"
            icon={<HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />}
          >
            <div className="space-y-3">
              {unansweredExceptLatest.map((review) => (
                <ReviewCard key={review.id} review={review} onReplied={refresh} />
              ))}
            </div>
          </OverviewSectionCard>
        </div>
      ) : null}
    </div>
  );
}
