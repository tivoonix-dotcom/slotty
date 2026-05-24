import { useState } from 'react';
import { HiCalendarDays, HiCheckBadge, HiClock, HiStar } from 'react-icons/hi2';
import type { DemoMasterProfile } from '../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../features/services/model/demoMasters';
import type { DemoMasterService } from '../../features/services/model/demoMasters';
import { formatDurationMinutes } from '../client/lib/catalogFormat';
import { formatMasterCardSpecialty } from '../client/lib/catalogFormat';
import { MasterAddressBlock } from '../client/masterProfile/MasterAddressBlock';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import type {
  DemoBookingGridDay,
  DemoBookingGridSlot,
} from '../../features/booking/model/demoBookingSlotGrid';
import {
  bookingCard,
  bookingChipActive,
  bookingChipIdle,
  bookingMutedPanel,
  bookingSectionLabel,
  bookingSlotActive,
  bookingSlotIdle,
} from './bookingUi';
import { formatServicePrice } from './bookingFormat';
import { BookingCalendarOverlay } from './BookingCalendarOverlay';
import { BookingCheckoutExtras } from './BookingCheckoutExtras';
import { BookingFlowDesktopView } from './BookingFlowDesktopView';
import { BookingSuccessModal } from './BookingSuccessModal';
import type { BookingSuccessPayload } from './bookingTypes';

export type { BookingSuccessPayload };

type Props = {
  backTo: string;
  backLabel?: string;
  master: DemoMasterProfile;
  service: DemoMasterService;
  selectedDay: DemoBookingGridDay | null;
  selectedSlot: Pick<DemoBookingGridSlot, 'slotId' | 'timeLabel' | 'promotion'> | null;
  quickDateDays: DemoBookingGridDay[];
  slotDays: DemoBookingGridDay[];
  bookError: string | null;
  submitting: boolean;
  canConfirm: boolean;
  isCalendarOpen: boolean;
  success: BookingSuccessPayload | null;
  onPickDate: (dateIso: string) => void;
  onPickSlot: (slotId: string) => void;
  onOpenCalendar: () => void;
  onCloseCalendar: () => void;
  onPickCalendarDate: (dateIso: string) => void;
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

export function BookingFlowView({
  backTo,
  backLabel,
  master,
  service,
  selectedDay,
  selectedSlot,
  quickDateDays,
  slotDays,
  bookError,
  submitting,
  canConfirm,
  isCalendarOpen,
  success,
  onPickDate,
  onPickSlot,
  onOpenCalendar,
  onCloseCalendar,
  onPickCalendarDate,
  onConfirm,
}: Props) {
  const showVerified = master.rating >= 4.5 && master.reviewsCount >= 10;
  const slotPromo = selectedSlot?.promotion;
  const displayPrice =
    slotPromo && slotPromo.discountedPrice >= 0
      ? slotPromo.discountedPrice
      : service.price;
  const pricePrefix = service.priceType === 'from' ? 'от ' : '';
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientComment, setClientComment] = useState('');

  return (
    <>
      <BookingFlowDesktopView
        backTo={backTo}
        backLabel={backLabel}
        master={master}
        service={service}
        selectedDay={selectedDay}
        selectedSlot={selectedSlot}
        quickDateDays={quickDateDays}
        bookError={bookError}
        submitting={submitting}
        canConfirm={canConfirm}
        acceptedTerms={acceptedTerms}
        onAcceptedTermsChange={setAcceptedTerms}
        comment={clientComment}
        onCommentChange={setClientComment}
        onPickDate={onPickDate}
        onPickSlot={onPickSlot}
        onOpenCalendar={onOpenCalendar}
        onConfirm={onConfirm}
      />

      <div className="lg:hidden">
      <header className="mt-4">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#111827]">Запись</h1>
        <p className="mt-1.5 text-[15px] text-[#6B7280]">Выберите удобную дату и время</p>
      </header>

      <section className={`${bookingCard} mt-5 p-4`}>
        <div className="flex gap-3.5">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-[16px] bg-[#EBEBEB]">
            <ImageReveal
              src={optimizeAvatarUrl(master.photoUrl, 256)}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              <p className="line-clamp-2 text-[17px] font-semibold leading-snug text-[#111827]">
                {master.masterName}
              </p>
              {showVerified ? (
                <HiCheckBadge className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
              ) : null}
            </div>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {formatMasterCardSpecialty(master.category)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ReviewStars rating={master.rating} />
              <span className="text-[14px] font-semibold text-[#111827]">
                {master.rating > 0 ? master.rating.toFixed(1) : 'Новый'}
              </span>
              <span className="text-[12px] text-[#9CA3AF]">
                {formatReviewsCountLabel(master.reviewsCount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${bookingCard} mt-3 p-4`}>
        <p className="text-[16px] font-semibold text-[#111827]">{service.title}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="inline-flex items-center gap-1 text-[14px] text-[#6B7280]">
            <HiClock className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
            {formatDurationMinutes(service.duration)}
          </span>
          <span className="text-[18px] font-bold text-[#111827]">{formatServicePrice(service)}</span>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className={bookingSectionLabel}>Дата</p>
          <button
            type="button"
            onClick={onOpenCalendar}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${bookingChipIdle}`}
          >
            <HiCalendarDays className="h-4 w-4 text-[#F47C8C]" aria-hidden />
            Календарь
          </button>
        </div>

        <div className={`${bookingMutedPanel} mb-3 px-4 py-3.5`}>
          <p className="text-[11px] font-medium text-[#9CA3AF]">Выбранная дата</p>
          <p className="mt-1 text-[18px] font-semibold capitalize text-[#111827]">
            {selectedDay?.fullDateLabel ?? '—'}
          </p>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickDateDays.map((day) => {
            const hasTimes = day.times.length > 0;
            const active = day.date === selectedDay?.date;
            return (
              <button
                key={day.id}
                type="button"
                disabled={!hasTimes}
                onClick={() => onPickDate(day.date)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${
                  active ? bookingChipActive : bookingChipIdle
                }`}
              >
                {day.dateLabel}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <p className={`${bookingSectionLabel} mb-3`}>Время</p>
        {selectedDay && selectedDay.times.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedDay.times.map((slot) => {
              const active = slot.slotId === selectedSlot?.slotId;
              const promo = slot.promotion;
              return (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => onPickSlot(slot.slotId)}
                  className={`relative min-h-11 min-w-[4.5rem] rounded-full px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
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
          <p className={`${bookingMutedPanel} px-4 py-6 text-center text-[14px] text-[#6B7280]`}>
            На этот день свободных слотов нет
          </p>
        )}
      </section>

      <section className={`${bookingCard} mt-6 p-4`}>
        <p className="mb-3 text-[15px] font-semibold text-[#111827]">Итого</p>
        <dl className="space-y-2.5 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Мастер</dt>
            <dd className="text-right font-medium text-[#111827]">{master.masterName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Услуга</dt>
            <dd className="max-w-[55%] text-right font-medium text-[#111827]">{service.title}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Дата</dt>
            <dd className="text-right font-medium capitalize text-[#111827]">
              {selectedDay?.fullDateLabel ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Время</dt>
            <dd className="text-right font-medium text-[#111827]">{selectedSlot?.timeLabel ?? '—'}</dd>
          </div>
          {slotPromo?.isSlotBound ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[#6B7280]">Акция</dt>
              <dd className="text-right text-[13px] font-semibold text-[#F47C8C]">Акция на это окно</dd>
            </div>
          ) : null}
        </dl>

        <div className={`${bookingMutedPanel} mt-4 p-3`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Адрес</p>
          <MasterAddressBlock location={master.location} />
        </div>

        <div className="mt-4 flex items-center justify-between pt-1">
          <span className="text-[14px] text-[#6B7280]">Стоимость</span>
          <div className="text-right">
            {slotPromo && slotPromo.discountedPrice < slotPromo.originalPrice ? (
              <span className="mr-2 text-[14px] font-medium text-[#9CA3AF] line-through">
                {pricePrefix}
                {Math.round(slotPromo.originalPrice)} BYN
              </span>
            ) : null}
            <span className="text-[18px] font-bold text-[#111827]">
              {displayPrice <= 0
                ? 'Бесплатно'
                : `${pricePrefix}${Math.round(displayPrice)} BYN`}
            </span>
          </div>
        </div>
        <BookingCheckoutExtras
          className="mt-5 border-t border-[#EEEEEE] pt-5"
          bookError={bookError}
          submitting={submitting}
          canConfirm={canConfirm}
          acceptedTerms={acceptedTerms}
          onAcceptedTermsChange={setAcceptedTerms}
          comment={clientComment}
          onCommentChange={setClientComment}
          onConfirm={onConfirm}
        />
      </section>
      </div>

      <BookingCalendarOverlay
        open={isCalendarOpen}
        slotDays={slotDays}
        selectedDate={selectedDay?.date ?? null}
        onClose={onCloseCalendar}
        onPickDate={onPickCalendarDate}
      />

      {success ? <BookingSuccessModal success={success} /> : null}
    </>
  );
}
