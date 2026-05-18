import { SectionHeading } from '../components/SectionHeading';
import type { DemoReview } from '../../../features/services/model/demoMasters';
import { ReviewCard } from './ReviewCard';

type Props = {
  reviews: DemoReview[];
  onViewAll?: () => void;
};

export function MasterReviewsSection({ reviews, onViewAll }: Props) {
  const preview = reviews.slice(0, 4);

  return (
    <section className="mt-8">
      <SectionHeading title="Отзывы" linkLabel="Смотреть все" onLinkClick={onViewAll} />
      {preview.length === 0 ? (
        <p className="rounded-[20px] bg-[#FAFAFA] px-4 py-8 text-center text-[14px] text-[#6B7280]">
          Отзывов пока нет
        </p>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {preview.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
