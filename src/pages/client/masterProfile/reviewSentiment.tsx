export type ReviewSentimentTone = 'positive' | 'neutral' | 'negative';

export function reviewSentimentTone(rating: number): ReviewSentimentTone {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

export function isPositiveReviewRating(rating: number): boolean {
  return rating >= 4;
}

const TONE_STYLES: Record<
  ReviewSentimentTone,
  { bg: string; eye: string; mouth: string; ring?: string }
> = {
  positive: { bg: '#DCFCE7', eye: '#15803D', mouth: '#15803D', ring: '#BBF7D0' },
  neutral: { bg: '#FEF3C7', eye: '#B45309', mouth: '#B45309', ring: '#FDE68A' },
  negative: { bg: '#FEE2E2', eye: '#DC2626', mouth: '#DC2626', ring: '#FECACA' },
};

export function ReviewSentimentIcon({
  tone,
  size = 'md',
  className = '',
}: {
  tone: ReviewSentimentTone;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const px = size === 'sm' ? 22 : 28;
  const palette = TONE_STYLES[tone];
  const mouthPath =
    tone === 'positive'
      ? 'M8 17c1.4 1.2 3.2 1.8 5 1.8s3.6-.6 5-1.8'
      : tone === 'neutral'
        ? 'M8.5 17.5h7'
        : 'M8 19c1.4-1.2 3.2-1.8 5-1.8s3.6.6 5 1.8';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: palette.bg,
        boxShadow: palette.ring ? `inset 0 0 0 1px ${palette.ring}` : undefined,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 26 26" width={px - 6} height={px - 6} fill="none">
        <circle cx="9" cy="11" r="1.35" fill={palette.eye} />
        <circle cx="17" cy="11" r="1.35" fill={palette.eye} />
        <path
          d={mouthPath}
          stroke={palette.mouth}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
