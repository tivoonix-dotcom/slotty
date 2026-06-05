import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_NOTIFICATIONS_PATH } from '../../../app/paths';
import { countReviewNotificationsNeedingReply } from '../../../features/notifications/reviewNotificationAction';
import { useAdminNotifications } from '../notifications/AdminNotificationsContext';
import {
  HiArrowTrendingUp,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiExclamationTriangle,
  HiStar,
} from 'react-icons/hi2';
import { OverviewRatingChart } from './charts';
import {
  computeReputationFromReviews,
  type MasterOverviewReview,
} from './overviewReputationDemo';
import { ratingToneFromValue, ratingToneUi } from './overviewRatingTone';
import {
  MINI_PICTURE,
  overviewCard,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';
import { OverviewReviewCard } from './OverviewReviewCard';
import {
  repAlertBanner,
  repEmptyList,
  repFilterChipClass,
  repReplyHintBg,
} from './overviewReputationTheme';
import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewPeriodLabel } from './overviewAnalytics';
import {
  OverviewHeroActionButton,
  OverviewDividedMetricsGrid,
  OverviewEmptyMetricCell,
  OverviewEmptyTabHero,
  OverviewMetricHeroPlaque,
} from './OverviewSharedUi';

type ReputationPanelProps = {
  data: import('./overviewReputationDemo').ReputationAnalyticsPayload;
  periodPreset: OverviewPeriodPreset;
  periodStart?: string;
  periodEnd?: string;
  useApi?: boolean;
  onReplied?: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
};

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

function RatingStars({
  value,
  light = false,
  size = 'md',
}: {
  value: number;
  light?: boolean;
  size?: 'sm' | 'md';
}) {
  const rounded = Math.round(value);
  const tone = ratingToneFromValue(value);
  const starClass = light ? 'text-white' : ratingToneUi[tone].stars;
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={`flex items-center justify-center gap-0.5 ${starClass}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar
          key={i}
          className={`${starSize} ${i <= rounded ? 'opacity-100' : 'opacity-25'}`}
        />
      ))}
    </div>
  );
}

function ReputationRatingMetricCell({ average }: { average: number }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] sm:text-[11px]">
        Рейтинг
      </p>
      <p className="mt-2 text-[clamp(1.5rem,4vw,1.875rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
        {average.toFixed(1)}
      </p>
      <div className="mt-2">
        <RatingStars value={average} size="sm" />
      </div>
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

function ReputationEmptyMetricsStrip({
  average,
  reviewsCount,
  newReviewsInPeriod,
  unansweredReviews,
}: {
  average: number;
  reviewsCount: number;
  newReviewsInPeriod: number;
  unansweredReviews: number;
}) {
  return (
    <OverviewDividedMetricsGrid>
      <ReputationRatingMetricCell average={average} />
      <OverviewEmptyMetricCell label="Отзывов" value={String(reviewsCount)} hint="Всего" />
      <OverviewEmptyMetricCell
        label="Новые"
        value={String(newReviewsInPeriod)}
        hint="За период"
      />
      <OverviewEmptyMetricCell
        label="Без ответа"
        value={String(unansweredReviews)}
        hint={unansweredReviews > 0 ? 'Нужен ответ' : 'Всё ок'}
      />
    </OverviewDividedMetricsGrid>
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
        alert={unansweredReviews > 0}
      />
    </OverviewKpiCarousel>
  );
}

function ReputationHeroPlaque({
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
  periodPreset,
}: {
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
  periodPreset: OverviewPeriodPreset;
}) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <OverviewMetricHeroPlaque
      value={
        <div className="flex flex-wrap items-end gap-4">
          <p className="text-[48px] font-black leading-none tabular-nums tracking-[-0.08em] text-[#111827] lg:text-[64px]">
            {average.toFixed(1)}
          </p>
          <div className="pb-1">
            <RatingStars value={average} />
            <p className="mt-2 text-[13px] font-semibold text-[#6B7280]">
              на основе {reviewsCountLabel(reviewsCount)}
            </p>
          </div>
        </div>
      }
      caption={
        <p className="max-w-[660px] text-[15px] font-semibold leading-relaxed text-[#6B7280] lg:text-[16px]">
          Отзывы и рейтинг за {period.toLowerCase()}. Отвечайте клиентам — это влияет на запись.
        </p>
      }
      action={
        unansweredReviews > 0 ? (
          <OverviewHeroActionButton onClick={onScrollToUnanswered}>
            {unansweredActionLabel(unansweredReviews)}
          </OverviewHeroActionButton>
        ) : undefined
      }
    />
  );
}

function ReputationHeroShell({
  children,
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
  periodPreset,
}: {
  children: React.ReactNode;
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
  periodPreset: OverviewPeriodPreset;
}) {
  return (
    <div className={`overflow-hidden ${overviewDesktopCard}`}>
      <ReputationHeroPlaque
        average={average}
        reviewsCount={reviewsCount}
        unansweredReviews={unansweredReviews}
        onScrollToUnanswered={onScrollToUnanswered}
        periodPreset={periodPreset}
      />
      <div className="overflow-hidden bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
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

          <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
            {data.ratingDelta !== null
              ? `${data.ratingDelta >= 0 ? '+' : ''}${data.ratingDelta.toFixed(
                  1,
                )} к прошлому периоду`
              : data.ratingByDay.length <= 2
                ? `Средняя оценка по ${data.ratingByDay.length === 1 ? 'дню' : 'дням'} с отзывами`
                : 'Средняя оценка в дни с отзывами'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {trendBadge}
          <span className={`${overviewIconCircle} h-11 w-11 rounded-[18px]`}>
            <HiStar className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </div>

      <OverviewRatingChart stats={data.ratingByDay} tone={ratingTone} size="large" />

      {data.chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за выбранный период.
        </p>
      ) : null}
    </section>
  );
}

type ReviewsFeedTab = 'unanswered' | 'all' | 'good' | 'poor';

function isGoodReview(rating: number): boolean {
  return rating >= 4;
}

function reviewsFeedTabLabel(tab: ReviewsFeedTab, count: number): string {
  switch (tab) {
    case 'unanswered':
      return count > 0 ? `Без ответа · ${count}` : 'Без ответа';
    case 'all':
      return count > 0 ? `Все · ${count}` : 'Все';
    case 'good':
      return count > 0 ? `4–5★ · ${count}` : '4–5★';
    default:
      return count > 0 ? `1–3★ · ${count}` : '1–3★';
  }
}

function UnifiedReviewsSection({
  reviews,
  unansweredCount,
  activeTab,
  onTabChange,
  onReplied,
  onReply,
  sectionRef,
}: {
  reviews: MasterOverviewReview[];
  unansweredCount: number;
  activeTab: ReviewsFeedTab;
  onTabChange: (tab: ReviewsFeedTab) => void;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
  sectionRef: React.RefObject<HTMLElement>;
}) {
  const unanswered = useMemo(() => reviews.filter((r) => !r.masterReply), [reviews]);
  const good = useMemo(() => reviews.filter((r) => isGoodReview(r.rating)), [reviews]);
  const poor = useMemo(() => reviews.filter((r) => !isGoodReview(r.rating)), [reviews]);

  const list = useMemo(() => {
    if (activeTab === 'unanswered') return unanswered;
    if (activeTab === 'good') return good;
    if (activeTab === 'poor') return poor;
    return reviews;
  }, [activeTab, good, poor, reviews, unanswered]);

  const emptyMessage =
    activeTab === 'unanswered'
      ? 'Все отзывы с ответом — отлично!'
      : activeTab === 'good'
        ? 'Пока нет отзывов 4–5★'
        : activeTab === 'poor'
          ? 'Нет отзывов 1–3★ — так держать!'
          : 'Отзывов за период пока нет';

  return (
    <section ref={sectionRef} className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">Отзывы</h2>
          <p className="mt-1 text-[13px] font-medium leading-snug text-[#6B7280]">
            {unansweredCount > 0
              ? `${unansweredCount} ждут ответа — ответ можно отправить только один раз`
              : 'Ответ можно отправить только один раз'}
          </p>
        </div>
        <SoftIcon>
          <HiChatBubbleLeftRight className="h-6 w-6" />
        </SoftIcon>
      </div>

      {unansweredCount > 0 ? (
        <div className={`mb-5 ${repAlertBanner}`}>
          <p className="text-[13px] font-semibold leading-snug text-[#92400E]">
            Сначала ответьте на отзывы без ответа — это видят клиенты в каталоге.
          </p>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Фильтр отзывов">
        {(['unanswered', 'all', 'good', 'poor'] as const).map((id) => {
          const count =
            id === 'unanswered'
              ? unanswered.length
              : id === 'all'
                ? reviews.length
                : id === 'good'
                  ? good.length
                  : poor.length;
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={repFilterChipClass(active, id)}
              onClick={() => onTabChange(id)}
            >
              {reviewsFeedTabLabel(id, count)}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className={repEmptyList}>{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <OverviewReviewCard
              key={review.id}
              review={review}
              onReplied={onReplied}
              onReply={onReply}
              showReply={!review.masterReply}
            />
          ))}
        </div>
      )}

      <div className="relative mt-6 overflow-hidden rounded-[16px]">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${repReplyHintBg})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/94 via-white/88 to-white/78"
          aria-hidden
        />
        <div className="relative flex items-start gap-3 px-4 py-3.5">
          <SoftIcon tone="green">
            <HiCheckCircle className="h-5 w-5" aria-hidden />
          </SoftIcon>
          <p className="min-w-0 text-[13px] leading-relaxed text-[#6B7280]">
            Вежливый ответ повышает доверие и помогает новым клиентам записаться.
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyReputationPanel({ periodPreset }: { periodPreset: OverviewPeriodPreset }) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      <OverviewEmptyTabHero
        metrics={
          <ReputationEmptyMetricsStrip
            average={0}
            reviewsCount={0}
            newReviewsInPeriod={0}
            unansweredReviews={0}
          />
        }
        title="Отзывов пока нет"
        caption={`После первых оценок здесь появятся рейтинг, динамика и отзывы за ${period.toLowerCase()}.`}
      />

      <section className={`${overviewCard} p-5 sm:p-8`}>
        <div className="flex items-start justify-between gap-4 lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <span className={`${overviewIconCircle} h-10 w-10 shrink-0 rounded-[16px] sm:h-11 sm:w-11 sm:rounded-[18px]`}>
              <HiStar className="h-5 w-5" aria-hidden />
            </span>

            <div className="min-w-0">
              <h2 className="pt-0.5 text-[18px] font-black leading-snug tracking-[-0.05em] text-[#111827] sm:text-[22px] sm:leading-tight">
                Как повысить доверие
              </h2>

              <p className="mt-3 max-w-[42rem] text-[14px] leading-[1.65] text-[#6B7280] sm:mt-4 sm:leading-7">
                Заполните профиль, добавьте портфолио, услуги, график и правила записи.
                Когда клиенты начнут оставлять отзывы, отвечайте им в спокойном и дружелюбном стиле.
              </p>
            </div>
          </div>

          <img
            src={MINI_PICTURE.trust}
            alt=""
            decoding="async"
            className="h-[72px] w-auto max-w-[38%] shrink-0 object-contain object-top sm:h-[100px] sm:max-w-none lg:h-[112px]"
          />
        </div>
      </section>
    </div>
  );
}

export function OverviewReputationPanel({
  data: dataProp,
  periodPreset,
  periodStart,
  periodEnd,
  useApi = false,
  onReplied,
  onReply,
}: ReputationPanelProps) {
  const reviewsRef = useRef<HTMLElement>(null);
  const [reviewsTab, setReviewsTab] = useState<ReviewsFeedTab>('all');
  const [tick, setTick] = useState(0);
  const { notifications } = useAdminNotifications();
  const reviewNotificationsCount = useMemo(
    () => countReviewNotificationsNeedingReply(notifications),
    [notifications],
  );

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

  useEffect(() => {
    if (data.unansweredReviews > 0) setReviewsTab('unanswered');
  }, [data.unansweredReviews]);

  if (!data.hasReviews) {
    return <EmptyReputationPanel periodPreset={periodPreset} />;
  }

  const average = data.averageRating ?? 0;
  const ratingTone = ratingToneFromValue(average);
  const ratingUi = ratingToneUi[ratingTone];

  const scrollToUnanswered = () => {
    setReviewsTab('unanswered');
    reviewsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      {reviewNotificationsCount > 0 ? (
        <Link
          to={`${ADMIN_NOTIFICATIONS_PATH}?filter=action_required`}
          className="flex items-center justify-between gap-3 rounded-[16px] bg-[#FFF1F4] px-4 py-3.5 shadow-[0_0_18px_rgba(255,95,122,0.18)] transition hover:bg-[#FFE8EE] active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#111827]">
              {reviewNotificationsCount === 1
                ? '1 отзыв ждёт ответа в уведомлениях'
                : `${reviewNotificationsCount} отзывов ждут ответа в уведомлениях`}
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              Откройте ленту — там же можно перейти к ответу
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#ff5f7a] px-2.5 py-1 text-[12px] font-bold text-white">
            {reviewNotificationsCount > 9 ? '9+' : reviewNotificationsCount}
          </span>
        </Link>
      ) : null}

      <ReputationHeroShell
        average={average}
        reviewsCount={data.reviewsCount}
        unansweredReviews={data.unansweredReviews}
        onScrollToUnanswered={scrollToUnanswered}
        periodPreset={periodPreset}
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

      <UnifiedReviewsSection
        reviews={data.reviews}
        unansweredCount={data.unansweredReviews}
        activeTab={reviewsTab}
        onTabChange={setReviewsTab}
        onReplied={refresh}
        onReply={onReply}
        sectionRef={reviewsRef}
      />
    </div>
  );
}