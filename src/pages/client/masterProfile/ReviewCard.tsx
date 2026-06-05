import { useEffect, useState } from 'react';
import type { DemoReview } from '../../../features/services/model/demoMasters';
import {
  isGeneratedPlaceholderAvatarUrl,
  profileDisplayInitials,
} from '../../../features/profile/lib/profileDisplayAvatar';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ReviewSentimentIcon, reviewSentimentTone } from './reviewSentiment';

type Props = { review: DemoReview; layout?: 'list' | 'stack' | 'desktop' };

function reviewAvatarSrc(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return null;
  return optimizeAvatarUrl(raw, 128) || raw;
}

function ReviewAuthorAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const src = reviewAvatarSrc(photoUrl);
  const initials = profileDisplayInitials(name);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
      <span className="text-[13px] font-bold tracking-tight">{initials}</span>
    </span>
  );
}

export function ReviewCard({ review, layout = 'list' }: Props) {
  const sentiment = reviewSentimentTone(review.rating);

  return (
    <article
      className={
        layout === 'list'
          ? 'px-4 py-4 sm:px-5 sm:py-5'
          : layout === 'desktop'
            ? 'rounded-[16px] bg-white p-4'
            : 'w-[min(78vw,17rem)] shrink-0 rounded-[12px] bg-[#FAFAFA] p-4 ring-1 ring-[#EEEEEE]'
      }
    >
      <div className="flex items-start gap-3">
        <ReviewAuthorAvatar name={review.author} photoUrl={review.authorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[#111827]">{review.author}</p>
              {review.date ? (
                <p className="text-[12px] text-[#9CA3AF]">{review.date}</p>
              ) : null}
            </div>
            <ReviewSentimentIcon tone={sentiment} size="sm" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-[#4B5563]">{review.text}</p>

      {review.masterReply ? (
        <div className="mt-3 rounded-[12px] bg-[#F6F7FB] px-3.5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#9CA3AF]">
            Ответ мастера
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#374151]">{review.masterReply}</p>
        </div>
      ) : null}
    </article>
  );
}
