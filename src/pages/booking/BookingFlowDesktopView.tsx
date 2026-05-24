import {
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiStar,
} from 'react-icons/hi2';
import type { DemoMasterProfile, DemoMasterService } from '../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../features/services/model/demoMasters';
import { formatDurationMinutes, formatMasterCardSpecialty } from '../client/lib/catalogFormat';
import {
  catalogDesktopSectionLabel,
  catalogSecondaryBtn,
} from '../client/servicesCatalog/servicesCatalogTheme';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import type {
  DemoBookingGridDay,
  DemoBookingGridSlot,
} from '../../features/booking/model/demoBookingSlotGrid';
import {
  bookingChipActive,
  bookingChipIdle,
  bookingMutedPanel,
  bookingSlotActive,
  bookingSlotIdle,
} from './bookingUi';
import { BookingCheckoutPanel } from './BookingCheckoutPanel';
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
  onPickDate: (dateIso: string) => void;
  onPickSlot: (slotId: string) => void;
  onOpenCalendar: () => void;
  onConfirm: () => void;
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
  onPickDate,
  onPickSlot,
  onOpenCalendar,
  onConfirm,
}: Props) {
  const showVerified = master.rating >= 4.5 && master.reviewsCount >= 10;
  const slotPromo = selectedSlot?.promotion;
  const displayPrice =
    slotPromo && slotPromo.discountedPrice >= 0 ? slotPromo.discountedPrice : service.price;
  const pricePrefix = service.priceType === 'from' ? 'от ' : '';

  return (
    <div className="hidden lg:block">
      <BookingDesktopHero
        backTo={backTo}
        backLabel={backLabel}
        masterName={master.masterName}
        serviceTitle={service.title}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        <div className="min-w-0 space-y-4">
          <section className={bookingDesktopCard}>
            <div className="flex gap-5">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[16px] bg-[#EBEBEB]">
                <ImageReveal
                  src={optimizeAvatarUrl(master.photoUrl, 320)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
                    {master.masterName}
                  </p>
                  {showVerified ? (
                    <HiCheckBadge className="mt-1 h-5 w-5 shrink-0 text-[#F47C8C]" aria-hidden />
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className={bookingDesktopSectionTitle}>Дата</p>
              <button
                type="button"
                onClick={onOpenCalendar}
                className={`${catalogSecondaryBtn} gap-2`}
              >
                <HiCalendarDays className="h-4 w-4 text-[#F47C8C]" aria-hidden />
                Полный календарь
              </button>
            </div>

            <div className={`${bookingMutedPanel} mb-5 px-4 py-3.5`}>
              <p className={catalogDesktopSectionLabel}>Выбранная дата</p>
              <p className="mt-1 text-[20px] font-bold capitalize tracking-[-0.02em] text-[#111827]">
                {selectedDay?.fullDateLabel ?? '—'}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {quickDateDays.map((day) => {
                const hasTimes = day.times.length > 0;
                const active = day.date === selectedDay?.date;
                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={!hasTimes}
                    onClick={() => onPickDate(day.date)}
                    className={`min-h-10 rounded-[10px] px-2 py-2 text-[13px] transition disabled:opacity-40 ${
                      active ? bookingChipActive : bookingChipIdle
                    }`}
                  >
                    {day.dateLabel}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={bookingDesktopPanel}>
            <p className={`${bookingDesktopSectionTitle} mb-4`}>Время</p>
            {selectedDay && selectedDay.times.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-7">
                {selectedDay.times.map((slot) => {
                  const active = slot.slotId === selectedSlot?.slotId;
                  const promo = slot.promotion;
                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      onClick={() => onPickSlot(slot.slotId)}
                      className={`min-h-11 rounded-[10px] px-3 py-2 text-[14px] transition ${
                        active ? bookingSlotActive : bookingSlotIdle
                      }`}
                    >
                      <span className="block">{slot.timeLabel}</span>
                      {promo ? (
                        <span
                          className={`mt-0.5 block text-[10px] font-bold leading-none ${
                            active ? 'text-white/90' : 'text-[#F47C8C]'
                          }`}
                        >
                          {promo.discountLabel}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={`${bookingMutedPanel} px-4 py-8 text-center text-[15px] text-[#6B7280]`}>
                На этот день свободных слотов нет — выберите другую дату
              </p>
            )}
          </section>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
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
            onConfirm={onConfirm}
          />
        </aside>
      </div>
    </div>
  );
}
