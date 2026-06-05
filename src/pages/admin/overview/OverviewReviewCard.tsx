import { useState } from 'react';
import { HiPaperAirplane, HiStar } from 'react-icons/hi2';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import { clientNameInputForResolve } from '../appointments/appointmentsFormat';
import {
  trySaveMasterReviewReply,
  type MasterOverviewReview,
} from './overviewReputationDemo';
import { formatReviewDayMonthRu } from './overviewFormat';
import {
  repMasterReplyPanel,
  repMasterReplyText,
  repReplyBtn,
  repReplyTextarea,
  repReplyWrap,
  repReviewAuthor,
  repReviewCard,
  repReviewDate,
  repReviewQuote,
  repReviewQuoteText,
  repReviewSectionLabel,
} from './overviewReputationTheme';

function ReviewRatingStars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="mt-1.5 flex items-center gap-1" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <HiStar
          key={i}
          className={`h-4 w-4 ${i < filled ? 'text-[#F47C8C]' : 'text-[#E5E7EB]'}`}
          aria-hidden
        />
      ))}
      <span className="ml-1 text-[13px] font-bold tabular-nums text-[#111827]">{rating}/5</span>
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
  const [busy, setBusy] = useState(false);
  const canSubmit = text.trim().length > 0 && !busy;

  if (review.masterReply) {
    return (
      <div className={repMasterReplyPanel}>
        <p className={repReviewSectionLabel}>Ваш ответ</p>
        <p className={repMasterReplyText}>{review.masterReply}</p>
      </div>
    );
  }

  return (
    <div className={repReplyWrap}>
      <p className={repReviewSectionLabel}>Ответ клиенту</p>
      <textarea
        value={text}
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
        }}
        rows={3}
        placeholder="Поблагодарите за отзыв и ответьте по делу — ответ отправится один раз"
        className={repReplyTextarea}
      />
      {error ? <p className="text-[12px] font-semibold text-[#EF4444]">{error}</p> : null}
      <button
        type="button"
        disabled={!canSubmit}
        className={repReplyBtn}
        onClick={() => {
          void (async () => {
            setBusy(true);
            setError('');
            try {
              if (onReply) {
                await onReply(review.id, text);
                setText('');
                onReplied();
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
            } catch (e) {
              if (e instanceof Error && e.message === 'ALREADY_REPLIED') {
                setError('На этот отзыв уже можно ответить только один раз.');
              } else {
                setError('Не удалось отправить ответ.');
              }
              onReplied();
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <HiPaperAirplane className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {busy ? 'Отправляем…' : 'Ответить'}
      </button>
    </div>
  );
}

type ReviewCardProps = {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
  showReply?: boolean;
  /** Без ответа — только просмотр (например, в списке «хорошие»). */
  compact?: boolean;
};

export function OverviewReviewCard({
  review,
  onReplied,
  onReply,
  showReply = true,
  compact = false,
}: ReviewCardProps) {
  const displayName =
    resolveNotificationClientName({
      full_name: clientNameInputForResolve(review.author),
    }) ??
    clientNameInputForResolve(review.author) ??
    'Клиент';
  const needsReply = showReply && !review.masterReply && !compact;

  return (
    <article className={repReviewCard}>
      <div className="flex items-start gap-3">
        <AppointmentsClientAvatar
          name={displayName}
          photoUrl={review.authorAvatarUrl}
          size="md"
          portraitScope="review"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 truncate ${repReviewAuthor}`}>{displayName}</p>
            <p className={repReviewDate}>{formatReviewDayMonthRu(review.dateIso)}</p>
          </div>
          <ReviewRatingStars rating={review.rating} />
        </div>
      </div>

      <div className={repReviewQuote}>
        <p className={repReviewQuoteText}>«{review.text}»</p>
      </div>

      {needsReply ? (
        <ReviewReplyBlock review={review} onReplied={onReplied} onReply={onReply} />
      ) : review.masterReply ? (
        <div className={repMasterReplyPanel}>
          <p className={repReviewSectionLabel}>Ваш ответ</p>
          <p className={repMasterReplyText}>{review.masterReply}</p>
        </div>
      ) : null}
    </article>
  );
}
