import {
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiStar,
  HiXMark,
} from 'react-icons/hi2';
import type { DemoMasterProfile } from '../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../features/services/model/demoMasters';
import type { DemoMasterService } from '../../features/services/model/demoMasters';
import { formatDurationMinutes } from '../client/lib/catalogFormat';
import { formatMasterCardSpecialty } from '../client/lib/catalogFormat';
import { MasterAddressBlock } from '../client/masterProfile/MasterAddressBlock';
import { clientPinkBtn } from '../client/clientTheme';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import type { DemoBookingGridDay } from '../../features/booking/model/demoBookingSlotGrid';
import type { CalendarMonth } from './bookingCalendar';
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
import { BookingSuccessModal } from './BookingSuccessModal';
import type { BookingSuccessPayload } from './bookingTypes';

export type { BookingSuccessPayload };

type Props = {
  master: DemoMasterProfile;
  service: DemoMasterService;
  selectedDay: DemoBookingGridDay | null;
  selectedSlot: { slotId: string; timeLabel: string } | null;
  quickDateDays: DemoBookingGridDay[];
  calendarMonths: CalendarMonth[];
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
  master,
  service,
  selectedDay,
  selectedSlot,
  quickDateDays,
  calendarMonths,
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

  return (
    <>
      <header className="mt-4">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#111827]">Запись</h1>
        <p className="mt-1.5 text-[15px] text-[#6B7280]">Выберите удобную дату и время</p>
      </header>

      <section className={`${bookingCard} mt-5 p-4`}>
        <div className="flex gap-3.5">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-[18px] bg-[#FFF1F4]">
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
              return (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => onPickSlot(slot.slotId)}
                  className={`min-h-11 min-w-[4.5rem] rounded-full px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
                    active ? bookingSlotActive : bookingSlotIdle
                  }`}
                >
                  {slot.timeLabel}
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
        </dl>

        <div className="mt-4 rounded-[16px] bg-[#FAFAFA] p-3 ring-1 ring-[#F3F4F6]">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Адрес</p>
          <MasterAddressBlock location={master.location} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
          <span className="text-[14px] text-[#6B7280]">Стоимость</span>
          <span className="text-[18px] font-bold text-[#111827]">{formatServicePrice(service)}</span>
        </div>
      </section>

      {bookError ? (
        <p className="mt-4 text-center text-[14px] font-medium text-red-600" role="alert">
          {bookError}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#F3F4F6]/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`${clientPinkBtn} w-full min-h-[52px] text-[16px] disabled:opacity-45`}
          >
            {submitting ? 'Отправляем…' : 'Подтвердить запись'}
          </button>
        </div>
      </div>

      {isCalendarOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Закрыть"
            onClick={onCloseCalendar}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[88dvh] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(17,24,39,0.12)]"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="text-[18px] font-semibold text-[#111827]">Выберите дату</h2>
              <button
                type="button"
                onClick={onCloseCalendar}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280]"
                aria-label="Закрыть"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70dvh] overflow-y-auto px-5 pb-6">
              {calendarMonths.map((month) => (
                <section key={month.key} className="mb-6">
                  <h3 className="mb-3 text-[16px] font-semibold text-[#111827]">{month.title}</h3>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#9CA3AF]">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {month.cells.map((day, index) => {
                      if (!day) return <div key={`e-${month.key}-${index}`} />;
                      const active = day.date === selectedDay?.date;
                      const disabled = day.times.length === 0;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={disabled}
                          onClick={() => onPickCalendarDate(day.date)}
                          className={`flex aspect-square flex-col items-center justify-center rounded-[14px] text-[14px] font-semibold transition ${
                            active
                              ? 'bg-[#F47C8C] text-white'
                              : disabled
                                ? 'bg-[#FAFAFA] text-[#D1D5DB]'
                                : 'bg-[#F1EFEF] text-[#111827]'
                          }`}
                        >
                          {day.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {success ? <BookingSuccessModal success={success} /> : null}
    </>
  );
}
