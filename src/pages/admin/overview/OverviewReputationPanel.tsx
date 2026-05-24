import { useCallback, useMemo, useRef, useState } from 'react';
import {
  HiArrowTrendingUp,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiExclamationTriangle,
  HiStar,
} from 'react-icons/hi2';
import { OverviewRatingChart } from './OverviewRatingChart';
import {
  computeReputationFromReviews,
  trySaveMasterReviewReply,
  type MasterOverviewReview,
} from './overviewReputationDemo';
import { formatReviewDayMonthRu } from './overviewFormat';
import { ratingToneFromValue, ratingToneUi } from './overviewRatingTone';
import {
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';

type ReputationPanelProps = {
  data: import('./overviewReputationDemo').ReputationAnalyticsPayload;
  periodStart?: string;
  periodEnd?: string;
  useApi?: boolean;
  onReplied?: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
};

const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

function reviewsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} отзывов`;
  if (mod10 === 1) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`;

  return `${n} отзывов`;
}

function unansweredActionLabel(n: number): string {
  if (n === 1) return 'Ответить на 1 отзыв';

  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `Ответить на ${n} отзывов`;
  if (mod10 >= 2 && mod10 <= 4) return `Ответить на ${n} отзыва`;

  return `Ответить на ${n} отзывов`;
}

function RatingStars({ value, light = false }: { value: number; light?: boolean }) {
  const rounded = Math.round(value);
  const tone = ratingToneFromValue(value);
  const starClass = light ? 'text-white' : ratingToneUi[tone].stars;

  return (
    <div className={`flex items-center gap-0.5 ${starClass}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar
          key={i}
          className={`h-5 w-5 ${i <= rounded ? 'opacity-100' : 'opacity-25'}`}
        />
      ))}
    </div>
  );
}

function TrendText({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-[#9CA3AF]">без изменений</span>;
  }

  const sign = delta > 0 ? '+' : '';

  return (
    <span className={delta > 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>
      {sign}
      {delta} к прошлому периоду
    </span>
  );
}

function SoftIcon({
  children,
  tone = 'pink',
}: {
  children: React.ReactNode;
  tone?: 'pink' | 'green' | 'yellow';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#ECFDF3] text-[#22C55E]'
      : tone === 'yellow'
        ? 'bg-[#FFF7ED] text-[#F59E0B]'
        : 'bg-[#FFF1F4] text-[#ff5f7a]';

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function ReputationMetricsCarousel({
  average,
  ratingUi,
  reviewsCount,
  totalReviewsDelta,
  newReviewsInPeriod,
  newReviewsDelta,
  unansweredReviews,
}: {
  average: number;
  ratingUi: (typeof ratingToneUi)[keyof typeof ratingToneUi];
  reviewsCount: number;
  totalReviewsDelta: number;
  newReviewsInPeriod: number;
  newReviewsDelta: number;
  unansweredReviews: number;
}) {
  return (
    <OverviewKpiCarousel>
      <OverviewKpiStatCard
        surface="carousel"
        label="Средний рейтинг"
        value={`${average.toFixed(1)} / 5`}
        hint={`На основе ${reviewsCountLabel(reviewsCount)}`}
        icon={<HiStar className={`h-5 w-5 ${ratingUi.stars}`} aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Всего отзывов"
        value={String(reviewsCount)}
        hint={<TrendText delta={totalReviewsDelta} />}
        icon={<HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Новые отзывы"
        value={String(newReviewsInPeriod)}
        hint={<TrendText delta={newReviewsDelta} />}
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Без ответа"
        value={String(unansweredReviews)}
        hint={unansweredReviews > 0 ? 'Нужен ваш ответ' : 'Всё отвечено'}
        icon={<HiExclamationTriangle className="h-5 w-5" aria-hidden />}
      />
    </OverviewKpiCarousel>
  );
}

function ReputationHeroCard({
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
  embedded = false,
}: {
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? `relative overflow-hidden ${SLOTTY_GRADIENT} p-6 text-white lg:p-8`
          : `relative overflow-hidden rounded-[32px] ${SLOTTY_GRADIENT} p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8`
      }
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          <HiStar className="h-4 w-4" aria-hidden />
          Репутация мастера
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-4">
          <p className="text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:text-[72px]">
            {average.toFixed(1)}
          </p>

          <div className="pb-2">
            <RatingStars value={average} light />
            <p className="mt-2 text-[14px] font-semibold text-white/70">
              на основе {reviewsCountLabel(reviewsCount)}
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          Следите за отзывами, отвечайте клиентам и повышайте доверие к профилю.
          Репутация напрямую влияет на решение клиента записаться.
        </p>

        {unansweredReviews > 0 ? (
          <button
            type="button"
            onClick={onScrollToUnanswered}
            className="mt-6 inline-flex items-center justify-center rounded-[20px] bg-white px-5 py-3 text-[14px] font-black text-[#111827] transition hover:-translate-y-0.5"
          >
            {unansweredActionLabel(unansweredReviews)}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReputationEmptyHero({ embedded = false }: { embedded?: boolean }) {
  return (
    <section
      className={
        embedded
          ? `relative overflow-hidden ${SLOTTY_GRADIENT} p-6 text-white lg:p-8`
          : `relative overflow-hidden rounded-[32px] ${SLOTTY_GRADIENT} p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8`
      }
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          <HiStar className="h-4 w-4" aria-hidden />
          Репутация мастера
        </p>

        <h1 className="mt-8 text-[42px] font-black leading-none tracking-[-0.08em] text-white lg:text-[64px]">
          Отзывов пока нет
        </h1>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          После первых оценок здесь появятся рейтинг, динамика и отзывы клиентов.
        </p>
      </div>
    </section>
  );
}

function ReputationHeroShell({
  children,
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
}: {
  children: React.ReactNode;
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
}) {
  return (
    <div className={`overflow-hidden ${overviewDesktopCard}`}>
      <ReputationHeroCard
        embedded
        average={average}
        reviewsCount={reviewsCount}
        unansweredReviews={unansweredReviews}
        onScrollToUnanswered={onScrollToUnanswered}
      />
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function ReviewReplyBlock({
  review,
  onReplied,
  onReply,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const canSubmit = text.trim().length > 0;

  if (review.masterReply) {
    return (
      <div className="mt-4 rounded-[18px] bg-[#FFF7F9] p-4 ring-1 ring-[#FFE1E8]">
        <p className="text-[11px] font-black uppercase tracking-wide text-[#ff5f7a]">
          Ваш ответ
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">
          {review.masterReply}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
        }}
        rows={3}
        placeholder="Напишите аккуратный ответ клиенту…"
        className="w-full resize-none rounded-[18px] border border-[#EEF0F5] bg-[#F9FAFB] px-4 py-3 text-[13px] font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#ff9aad] focus:bg-white focus:ring-4 focus:ring-[#FFF1F4]"
      />

      {error ? (
        <p className="text-[12px] font-bold text-[#EF4444]">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        className="w-full rounded-[18px] bg-[#ff5f7a] px-5 py-3 text-[14px] font-black text-white shadow-[0_12px_28px_rgba(255,95,122,0.24)] transition hover:bg-[#f04f6c] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => {
          void (async () => {
            if (onReply) {
              try {
                await onReply(review.id, text);
                setText('');
                onReplied();
              } catch (e) {
                if (e instanceof Error && e.message === 'ALREADY_REPLIED') {
                  setError('На этот отзыв уже можно ответить только один раз.');
                } else {
                  setError('Не удалось отправить ответ.');
                }
                onReplied();
              }
              return;
            }

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
          })();
        }}
      >
        Ответить клиенту
      </button>
    </div>
  );
}

function ReviewCard({
  review,
  onReplied,
  onReply,
  showReply = true,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
  showReply?: boolean;
}) {
  return (
    <article className="rounded-[24px] bg-[#F9FAFB] p-4 ring-1 ring-[#EEF0F5]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8aa0] to-[#ff5f7a] text-[15px] font-black text-white shadow-[0_10px_24px_rgba(255,95,122,0.24)]">
          {review.authorInitial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-black text-[#111827]">
              {review.author}
            </p>

            <p className="text-[12px] font-semibold text-[#9CA3AF]">
              {formatReviewDayMonthRu(review.dateIso)}
            </p>
          </div>

          <div className="mt-1">
            <RatingStars value={review.rating} />
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#374151]">
            {review.text}
          </p>
        </div>
      </div>

      {showReply ? (
        <ReviewReplyBlock review={review} onReplied={onReplied} onReply={onReply} />
      ) : null}
    </article>
  );
}

function RatingChartCard({
  data,
  ratingTone,
}: {
  data: import('./overviewReputationDemo').ReputationAnalyticsPayload;
  ratingTone: ReturnType<typeof ratingToneFromValue>;
}) {
  const trendBadge =
    data.ratingTrendPercent !== null && data.ratingTrend === 'up' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-3 py-1.5 text-[12px] font-black text-[#16A34A]">
        <HiArrowTrendingUp className="h-4 w-4" />
        +{data.ratingTrendPercent}%
      </span>
    ) : null;

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Динамика рейтинга
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {data.ratingDelta !== null
              ? `${data.ratingDelta >= 0 ? '+' : ''}${data.ratingDelta.toFixed(
                  1,
                )} к прошлому периоду`
              : 'Средний рейтинг по дням'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {trendBadge}
          <span className={`${overviewIconCircle} h-11 w-11 rounded-[18px]`}>
            <HiStar className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </div>

      <OverviewRatingChart stats={data.ratingByDay} tone={ratingTone} />

      {data.chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function LatestReviewCard({
  review,
  onReplied,
  onReply,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Последний отзыв
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Ответ можно отправить только один раз.
          </p>
        </div>

        <SoftIcon>
          <HiChatBubbleLeftRight className="h-6 w-6" />
        </SoftIcon>
      </div>

      <ReviewCard review={review} onReplied={onReplied} onReply={onReply} />
    </section>
  );
}

function ReputationTrustCard() {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
      <div className="flex items-start gap-3">
        <SoftIcon tone="green">
          <HiCheckCircle className="h-6 w-6" aria-hidden />
        </SoftIcon>

        <div>
          <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827]">
            Отвечайте на отзывы
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
            Вежливый ответ повышает доверие и помогает новым клиентам записаться.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] bg-[#f6f7fb] p-5">
        <p className="text-[14px] font-black text-[#111827]">Что важно смотреть?</p>
        <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
          Стабильный рейтинг, новые отзывы и быстрые ответы — главные сигналы качества
          для клиентов в каталоге.
        </p>
      </div>
    </section>
  );
}

function UnansweredReviewsCard({
  reviews,
  onReplied,
  onReply,
}: {
  reviews: MasterOverviewReview[];
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Отзывы без ответа
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Отвечайте спокойно и профессионально. Ответ изменить нельзя.
          </p>
        </div>

        <SoftIcon tone="yellow">
          <HiExclamationTriangle className="h-6 w-6" />
        </SoftIcon>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReplied={onReplied}
            onReply={onReply}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyReputationPanel() {
  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden lg:space-y-6">
      <div className={`overflow-hidden ${overviewDesktopCard}`}>
        <ReputationEmptyHero embedded />
        <div className="bg-white px-3 pb-4 pt-1 sm:px-4">
          <ReputationMetricsCarousel
            average={0}
            ratingUi={ratingToneUi.empty}
            reviewsCount={0}
            totalReviewsDelta={0}
            newReviewsInPeriod={0}
            newReviewsDelta={0}
            unansweredReviews={0}
          />
        </div>
      </div>

      <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
        <div className="flex items-start gap-3">
          <span className={`${overviewIconCircle} h-11 w-11 shrink-0 rounded-[18px]`}>
            <HiStar className="h-5 w-5" aria-hidden />
          </span>

          <div>
            <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
              Как повысить доверие
            </h2>

            <p className="mt-2 max-w-[720px] text-[14px] leading-7 text-[#6B7280]">
              Заполните профиль, добавьте портфолио, услуги, график и правила записи.
              Когда клиенты начнут оставлять отзывы, отвечайте им в спокойном и дружелюбном стиле.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function OverviewReputationPanel({
  data: dataProp,
  periodStart,
  periodEnd,
  useApi = false,
  onReplied,
  onReply,
}: ReputationPanelProps) {
  const unansweredRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  const refreshLocal = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const refresh = onReplied ?? refreshLocal;

  const dataFromPeriod = useMemo(() => {
    if (useApi || !periodStart || !periodEnd) return null;

    void tick;

    return computeReputationFromReviews(periodStart, periodEnd);
  }, [periodEnd, periodStart, tick, useApi]);

  const data = useApi ? dataProp : dataFromPeriod ?? dataProp;

  const unansweredExceptLatest = useMemo(() => {
    const latestId = data.latestReview?.id;

    return data.unansweredList.filter((review) => review.id !== latestId);
  }, [data.latestReview?.id, data.unansweredList]);

  if (!data.hasReviews) {
    return <EmptyReputationPanel />;
  }

  const average = data.averageRating ?? 0;
  const ratingTone = ratingToneFromValue(average);
  const ratingUi = ratingToneUi[ratingTone];

  const scrollToUnanswered = () =>
    unansweredRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden lg:space-y-6">
      <ReputationHeroShell
        average={average}
        reviewsCount={data.reviewsCount}
        unansweredReviews={data.unansweredReviews}
        onScrollToUnanswered={scrollToUnanswered}
      >
        <ReputationMetricsCarousel
          average={average}
          ratingUi={ratingUi}
          reviewsCount={data.reviewsCount}
          totalReviewsDelta={data.totalReviewsDelta}
          newReviewsInPeriod={data.newReviewsInPeriod}
          newReviewsDelta={data.newReviewsDelta}
          unansweredReviews={data.unansweredReviews}
        />
      </ReputationHeroShell>

      <RatingChartCard data={data} ratingTone={ratingTone} />

      <section className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {data.latestReview ? (
          <LatestReviewCard
            review={data.latestReview}
            onReplied={refresh}
            onReply={onReply}
          />
        ) : (
          <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
            <div className="flex items-start gap-3">
              <span className={`${overviewIconCircle} h-11 w-11 shrink-0 rounded-[18px]`}>
                <HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />
              </span>

              <div>
                <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
                  Последний отзыв
                </h2>

                <p className="mt-2 text-[14px] leading-7 text-[#6B7280]">
                  Когда клиент оставит отзыв, он появится здесь.
                </p>
              </div>
            </div>
          </section>
        )}

        <ReputationTrustCard />
      </section>

      {unansweredExceptLatest.length > 0 ? (
        <div ref={unansweredRef}>
          <UnansweredReviewsCard
            reviews={unansweredExceptLatest}
            onReplied={refresh}
            onReply={onReply}
          />
        </div>
      ) : data.unansweredReviews > 0 && data.latestReview ? (
        <div ref={unansweredRef} />
      ) : null}
    </div>
  );
}