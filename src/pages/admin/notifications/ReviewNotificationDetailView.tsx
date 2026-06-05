import { HiPhone, HiStar } from 'react-icons/hi2';
import type { MasterReviewNotificationDetail } from '../../../features/admin/api/masterOverviewApi';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import {
  notifDetailInsetPanel,
  notifDetailInsetRow,
  notifDetailReviewQuote,
  notifDetailSectionTitle,
} from './adminNotificationsTheme';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <HiStar
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-[#F47C8C]' : 'text-[#E5E7EB]'}`}
          aria-hidden
        />
      ))}
      <span className="ml-1.5 text-[16px] font-bold tabular-nums text-[#111827]">{rating}/5</span>
    </div>
  );
}

type Props = {
  review: MasterReviewNotificationDetail;
};

export function ReviewNotificationDetailView({ review }: Props) {
  const displayName =
    resolveNotificationClientName({
      full_name: review.clientName,
      phone: review.clientPhone,
    }) ?? (review.clientName?.trim() || 'Клиент');
  const phoneHref = review.clientPhone ? `tel:${review.clientPhone.replace(/\s/g, '')}` : null;

  return (
    <div className="space-y-3">
      <div className={notifDetailInsetPanel}>
        <div className="flex items-start gap-3">
          <AppointmentsClientAvatar
            name={displayName}
            phone={review.clientPhone}
            photoUrl={review.clientAvatarUrl}
            size="md"
            portraitScope="review"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
              Клиент
            </p>
            <p className="mt-0.5 text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
              {displayName}
            </p>
            {phoneHref ? (
              <a
                href={phoneHref}
                className="mt-1 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C]"
              >
                <HiPhone className="h-4 w-4" aria-hidden />
                {review.clientPhone}
              </a>
            ) : (
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Телефон не указан</p>
            )}
          </div>
        </div>
      </div>

      <div className={`${notifDetailInsetPanel} bg-[#ECFDF5]`}>
        <p className={notifDetailSectionTitle}>Оценка</p>
        <div className="mt-2">
          <RatingStars rating={review.rating} />
        </div>
      </div>

      {review.body ? (
        <div className={notifDetailReviewQuote}>
          <p className={notifDetailSectionTitle}>Текст отзыва</p>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#374151]">
            «{review.body}»
          </p>
        </div>
      ) : null}

      <div className={notifDetailInsetPanel}>
        <p className={notifDetailSectionTitle}>Визит</p>
        <div className="mt-2 space-y-2">
          <div className={notifDetailInsetRow}>
            <span className="text-[13px] font-medium text-[#6B7280]">Услуга</span>
            <span className="text-[14px] font-semibold text-[#111827]">{review.serviceName}</span>
          </div>
          <div className={notifDetailInsetRow}>
            <span className="text-[13px] font-medium text-[#6B7280]">Дата визита</span>
            <span className="text-[14px] font-semibold text-[#111827]">{review.visitAt}</span>
          </div>
          {review.bookingCode ? (
            <div className={notifDetailInsetRow}>
              <span className="text-[13px] font-medium text-[#6B7280]">Номер записи</span>
              <span className="text-[14px] font-semibold uppercase text-[#111827]">
                {review.bookingCode}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
