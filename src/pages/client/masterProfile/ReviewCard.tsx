import { HiStar } from 'react-icons/hi2';
import type { DemoReview } from '../../../features/services/model/demoMasters';

type Props = { review: DemoReview };

export function ReviewCard({ review }: Props) {
  const filled = Math.min(5, Math.max(0, Math.round(review.rating)));

  return (
    <article className="w-[min(85vw,18rem)] shrink-0 rounded-[22px] bg-white p-4 shadow-[0_8px_28px_rgba(17,24,39,0.06)] ring-1 ring-[#F3F4F6]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1F4] text-[14px] font-bold text-[#F47C8C]">
          {(review.author[0] ?? 'К').toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[#111827]">{review.author}</p>
          {review.date ? (
            <p className="text-[12px] text-[#9CA3AF]">{review.date}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex gap-0.5" aria-label={`Оценка ${review.rating}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <HiStar
            key={i}
            className={`h-3.5 w-3.5 ${i < filled ? 'text-[#F47C8C]' : 'text-[#E5E7EB]'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-2 line-clamp-4 text-[14px] leading-relaxed text-[#4B5563]">{review.text}</p>
    </article>
  );
}
