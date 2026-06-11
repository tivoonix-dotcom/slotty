import { Link } from 'react-router-dom';
import { EMPTY_BOOKING_DATE } from '../../shared/lib/emptyDisplayText';
import { HiClock, HiStar } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../features/masters/lib/masterVerifiedBadge';
import { MasterVerifiedBadge } from '../../shared/ui/MasterVerifiedBadge';
import type { DemoMasterProfile, DemoMasterService } from '../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../features/services/model/demoMasters';
import { formatDurationMinutes, formatMasterCardSpecialty } from '../client/lib/catalogFormat';
import { catalogDesktopSectionLabel } from '../client/servicesCatalog/servicesCatalogTheme';
import { MasterCardPortrait } from '../client/components/MasterCardPortrait';
import { getMasterPath } from '../../app/paths';
import type {
  DemoBookingGridDay,
  DemoBookingGridSlot,
} from '../../features/booking/model/demoBookingSlotGrid';
import { bookingMutedPanel } from './bookingUi';
import { BookingCheckoutPanel } from './BookingCheckoutPanel';
import { BookingDateStrip } from './BookingDateStrip';
import { BookingTimeSlots } from './BookingTimeSlots';
import { BookingDesktopHero } from './BookingDesktopHero';
import { bookingDesktopCard, bookingDesktopPanel, bookingDesktopSectionTitle } from './bookingDesktopTheme';
import { formatServicePrice } from './bookingFormat';

type Props = {
  backTo: string;
  backLabel?: string;
  master: DemoMasterProfile;
  service: DemoMasterService;
  selectedDay: DemoBookingGridDay | null;
  selectedSlot: Pick<DemoBookingGridSlot, 'slotId' | 'timeLabel' | 'promotion'> | null;
  quickDateDays: DemoBookingGridDay[];
  bookError: string | null;
  submitting: boolean;
  canConfirm: boolean;
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  referencePhotoUrl: string | null;
  onReferencePhotoUrlChange: (url: string | null) => void;
  isCalendarOpen: boolean;
  onPickDate: (dateIso: string) => void;
  onPickSlot: (slotId: string) => void;
  onOpenCalendar: () => void;
  onConfirm: () => void;
  ruleLines?: string[];
};

function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <HiStar
          key={i}
          className={`h-4 w-4 ${i < filled ? 'text-amber-400' : 'text-[#E5E7EB]'}`}
        />
      ))}
    </div>
  );
}

export function BookingFlowDesktopView({
  backTo,
  backLabel,
  master,
  service,
  selectedDay,
  selectedSlot,
  quickDateDays,
  bookError,
  submitting,
  canConfirm,
  acceptedTerms,
  onAcceptedTermsChange,
  comment,
  onCommentChange,
  referencePhotoUrl,
  onReferencePhotoUrlChange,
  isCalendarOpen,
  onPickDate,
  onPickSlot,
  onOpenCalendar,
  onConfirm,
  ruleLines,
}: Props) {
  const showVerified = masterShowsVerifiedBadge(master);
  const slotPromo = selectedSlot?.promotion;
  const displayPrice =
    slotPromo && slotPromo.discountedPrice >= 0 ? slotPromo.discountedPrice : service.price;
  const pricePrefix = service.priceType === 'from' ? 'от ' : '';

  return (
    <div className="hidden lg:block">
      <BookingDesktopHero
        backTo={backTo}
        backLabel={backLabel}
        masterProfileTo={getMasterPath(master.masterId)}
        masterName={master.masterName}
        serviceTitle={service.title}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        <div className="min-w-0 space-y-4">
          <section className={bookingDesktopCard}>
            <div className="flex gap-5">
              <MasterCardPortrait
                masterName={master.masterName}
                photoUrl={master.photoUrl}
                className="relative h-28 w-28 shrink-0"
                imageClassName="h-full w-full rounded-[16px] object-cover"
                loading="eager"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <Link
                    to={getMasterPath(master.masterId)}
                    className="min-w-0 truncate text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#111827] underline-offset-2 transition hover:text-[#F47C8C] hover:underline"
                    title={master.masterName}
                  >
                    {master.masterName}
                  </Link>
                  {showVerified ? (
                    <MasterVerifiedBadge className="mt-1 h-5 w-5 shrink-0 text-[#F47C8C]" />
                  ) : null}
                </div>
                <p className="mt-1 text-[14px] font-medium text-[#6B7280]">
                  {formatMasterCardSpecialty(master.category)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ReviewStars rating={master.rating} />
                  <span className="text-[15px] font-semibold text-[#111827]">
                    {master.rating > 0 ? master.rating.toFixed(1) : 'Новый'}
                  </span>
                  <span className="text-[13px] text-[#9CA3AF]">
                    {formatReviewsCountLabel(master.reviewsCount)}
                  </span>
                </div>
              </div>
              <div className="hidden shrink-0 text-right lg:block">
                <p className={bookingDesktopSectionTitle}>Услуга</p>
                <p className="mt-2 max-w-[220px] text-[16px] font-bold leading-snug text-[#111827]">
                  {service.title}
                </p>
                <div className="mt-3 flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 text-[14px] text-[#6B7280]">
                    <HiClock className="h-4 w-4" aria-hidden />
                    {formatDurationMinutes(service.duration)}
                  </span>
                  <span className="text-[20px] font-bold text-[#111827]">{formatServicePrice(service)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className={bookingDesktopPanel}>
            <p className={`${bookingDesktopSectionTitle} mb-4`}>Дата</p>

            <div className={`${bookingMutedPanel} mb-4 px-4 py-3.5`}>
              <p className={catalogDesktopSectionLabel}>Выбранная дата</p>
              <p className="mt-1 text-[20px] font-bold capitalize tracking-[-0.02em] text-[#111827]">
                {selectedDay?.fullDateLabel ?? EMPTY_BOOKING_DATE}
              </p>
            </div>

            <BookingDateStrip
              days={quickDateDays}
              selectedDate={selectedDay?.date ?? null}
              calendarOpen={isCalendarOpen}
              onPickDate={onPickDate}
              onOpenCalendar={onOpenCalendar}
            />
          </section>

          <section className={bookingDesktopPanel}>
            <p className={`${bookingDesktopSectionTitle} mb-4`}>Время</p>
            {selectedDay && selectedDay.times.length > 0 ? (
              <BookingTimeSlots
                slots={selectedDay.times}
                selectedSlotId={selectedSlot?.slotId ?? null}
                onPickSlot={onPickSlot}
              />
            ) : (
              <p className={`${bookingMutedPanel} px-4 py-8 text-center text-[15px] text-[#6B7280]`}>
                На этот день свободных слотов нет — выберите другую дату
              </p>
            )}
          </section>
        </div>

        <aside className="min-w-0 xl:self-start">
          <BookingCheckoutPanel
            masterName={master.masterName}
            serviceTitle={service.title}
            selectedDay={selectedDay}
            selectedSlot={selectedSlot}
            location={master.location}
            displayPrice={displayPrice}
            pricePrefix={pricePrefix}
            slotPromo={slotPromo}
            bookError={bookError}
            submitting={submitting}
            canConfirm={canConfirm}
            acceptedTerms={acceptedTerms}
            onAcceptedTermsChange={onAcceptedTermsChange}
            comment={comment}
            onCommentChange={onCommentChange}
            referencePhotoUrl={referencePhotoUrl}
            onReferencePhotoUrlChange={onReferencePhotoUrlChange}
            categoryCode={master.categoryCode}
            onConfirm={onConfirm}
            ruleLines={ruleLines}
          />
        </aside>
      </div>
    </div>
  );
}
