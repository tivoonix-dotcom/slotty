import { SectionHeading } from '../components/SectionHeading';
import type { DemoReview } from '../../../features/services/model/demoMasters';
import { ReviewCard } from './ReviewCard';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = {
  reviews: DemoReview[];
  onViewAll?: () => void;
  layout?: 'stack' | 'desktop';
};

export function MasterReviewsSection({ reviews, onViewAll, layout = 'stack' }: Props) {
  const preview = layout === 'desktop' ? reviews.slice(0, 6) : reviews.slice(0, 4);
  const isDesktop = layout === 'desktop';

  return (
    <section className={isDesktop ? '' : 'mt-0'}>
      <SectionHeading title="Отзывы" linkLabel="Смотреть все" onLinkClick={onViewAll} />
      {preview.length === 0 ? (
        <p className={`rounded-[16px] bg-[#FAFAFA] px-4 py-8 text-center text-[14px] text-[#6B7280] ${isDesktop ? catalogDesktopPanel : ''}`}>
          Отзывов пока нет
        </p>
      ) : isDesktop ? (
        <div className={`${catalogDesktopPanel} grid gap-3 p-3 sm:grid-cols-2`}>
          {preview.map((r) => (
            <ReviewCard key={r.id} review={r} layout="desktop" />
          ))}
        </div>
      ) : (
        <div className={`${catalogDesktopPanel} p-3`}>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {preview.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
