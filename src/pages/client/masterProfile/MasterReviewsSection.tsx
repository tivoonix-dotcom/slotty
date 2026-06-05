import { useMemo, useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import type { DemoReview } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { ReviewCard } from './ReviewCard';
import { catalogDesktopPanel, catalogPanelListClass } from './masterProfileTheme';
import {
  isPositiveReviewRating,
  ReviewSentimentIcon,
  type ReviewSentimentTone,
} from './reviewSentiment';

const PREVIEW_COUNT = 4;

type ReviewTab = 'positive' | 'negative';

type Props = {
  reviews: DemoReview[];
  onViewAll?: () => void;
  layout?: 'stack' | 'desktop';
};

function reviewsCountShort(n: number): string {
  return String(Math.max(0, n));
}

export function MasterReviewsSection({ reviews, onViewAll, layout = 'stack' }: Props) {
  const positive = useMemo(() => reviews.filter((r) => isPositiveReviewRating(r.rating)), [reviews]);
  const negative = useMemo(() => reviews.filter((r) => !isPositiveReviewRating(r.rating)), [reviews]);

  const [tab, setTab] = useState<ReviewTab>(() =>
    negative.length > 0 && positive.length === 0 ? 'negative' : 'positive',
  );
  const [expanded, setExpanded] = useState(false);

  const activeList = tab === 'positive' ? positive : negative;
  const hasMore = activeList.length > PREVIEW_COUNT;
  const visible = useMemo(
    () => (expanded || !hasMore ? activeList : activeList.slice(0, PREVIEW_COUNT)),
    [activeList, expanded, hasMore],
  );
  const hiddenCount = activeList.length - PREVIEW_COUNT;
  const subtitle =
    reviews.length > 0 ? formatReviewsCountLabel(reviews.length) : undefined;

  const showTabs = reviews.length > 0;

  return (
    <section className={layout === 'desktop' ? '' : 'mt-0'}>
      <SectionHeading
        title="Отзывы"
        subtitle={subtitle}
        linkLabel="Смотреть все"
        onLinkClick={onViewAll}
      />
      {reviews.length === 0 ? (
        <p
          className={`rounded-[16px] bg-[#FAFAFA] px-4 py-8 text-center text-[14px] text-[#6B7280] ${
            layout === 'desktop' ? catalogDesktopPanel : ''
          }`}
        >
          Отзывов пока нет
        </p>
      ) : (
        <div className={catalogDesktopPanel}>
          {showTabs ? (
            <div
              className="flex border-b border-[#EEEEEE] px-4 sm:px-5"
              role="tablist"
              aria-label="Тип отзывов"
            >
              <ReviewTabButton
                active={tab === 'positive'}
                tone="positive"
                label="Положительные"
                count={positive.length}
                onClick={() => {
                  setTab('positive');
                  setExpanded(false);
                }}
              />
              <ReviewTabButton
                active={tab === 'negative'}
                tone="negative"
                label="Отрицательные"
                count={negative.length}
                onClick={() => {
                  setTab('negative');
                  setExpanded(false);
                }}
              />
            </div>
          ) : null}

          {activeList.length === 0 ? (
            <p className="px-4 py-10 text-center text-[14px] font-medium text-[#6B7280] sm:px-5">
              {tab === 'positive'
                ? 'Положительных отзывов пока нет'
                : 'Отрицательных отзывов нет — отлично!'}
            </p>
          ) : (
            <ul className={catalogPanelListClass}>
              {visible.map((review) => (
                <li key={review.id}>
                  <ReviewCard review={review} layout="list" />
                </li>
              ))}
            </ul>
          )}

          {hasMore && !expanded && activeList.length > 0 ? (
            <div className="border-t border-[#EEEEEE] px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full rounded-[10px] bg-[#F5F5F5] px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB] active:scale-[0.99]"
              >
                Показать ещё {formatReviewsCountLabel(hiddenCount)}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ReviewTabButton({
  active,
  tone,
  label,
  count,
  onClick,
}: {
  active: boolean;
  tone: ReviewSentimentTone;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const activeBorder =
    tone === 'positive' ? 'border-[#16A34A]' : 'border-[#EF4444]';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`mr-6 flex min-h-12 items-center gap-2 border-b-2 pb-3 pt-4 text-[14px] font-semibold transition last:mr-0 ${
        active
          ? `${activeBorder} text-[#111827]`
          : 'border-transparent text-[#6B7280] hover:text-[#374151]'
      }`}
    >
      <ReviewSentimentIcon tone={tone} size="sm" />
      <span>
        {label} {reviewsCountShort(count)}
      </span>
    </button>
  );
}
