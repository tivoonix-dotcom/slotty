import type { MasterLocation } from '../../features/profile/model/masterLocation';
import type { DemoBookingGridDay, DemoBookingGridSlot } from '../../features/booking/model/demoBookingSlotGrid';
import { MasterAddressBlock } from '../client/masterProfile/MasterAddressBlock';
import { catalogDesktopSectionLabel } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingDesktopPanel } from './bookingDesktopTheme';
import { bookingMutedPanel } from './bookingUi';
import { BookingCheckoutExtras } from './BookingCheckoutExtras';

type Props = {
  masterName: string;
  serviceTitle: string;
  selectedDay: DemoBookingGridDay | null;
  selectedSlot: Pick<DemoBookingGridSlot, 'slotId' | 'timeLabel' | 'promotion'> | null;
  location: MasterLocation;
  displayPrice: number;
  pricePrefix: string;
  slotPromo?: DemoBookingGridSlot['promotion'];
  bookError: string | null;
  submitting: boolean;
  canConfirm: boolean;
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
};

export function BookingCheckoutPanel({
  masterName,
  serviceTitle,
  selectedDay,
  selectedSlot,
  location,
  displayPrice,
  pricePrefix,
  slotPromo,
  bookError,
  submitting,
  canConfirm,
  acceptedTerms,
  onAcceptedTermsChange,
  comment,
  onCommentChange,
  onConfirm,
}: Props) {
  return (
    <div className={`${bookingDesktopPanel} space-y-5`}>
      <div>
        <p className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Итого</p>
        <p className="mt-0.5 text-[14px] text-[#6B7280]">Проверьте детали и подтвердите запись</p>
      </div>

      <dl className="space-y-0 text-[14px]">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[#6B7280]">Мастер</dt>
          <dd className="text-right font-semibold text-[#111827]">{masterName}</dd>
        </div>
        <div className="h-px bg-[#EEEEEE]" aria-hidden />
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[#6B7280]">Услуга</dt>
          <dd className="max-w-[58%] text-right font-semibold text-[#111827]">{serviceTitle}</dd>
        </div>
        <div className="h-px bg-[#EEEEEE]" aria-hidden />
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[#6B7280]">Дата</dt>
          <dd className="text-right font-semibold capitalize text-[#111827]">
            {selectedDay?.fullDateLabel ?? '—'}
          </dd>
        </div>
        <div className="h-px bg-[#EEEEEE]" aria-hidden />
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[#6B7280]">Время</dt>
          <dd className="text-right font-semibold text-[#111827]">{selectedSlot?.timeLabel ?? '—'}</dd>
        </div>
        {slotPromo?.isSlotBound ? (
          <>
            <div className="h-px bg-[#EEEEEE]" aria-hidden />
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[#6B7280]">Акция</dt>
              <dd className="text-right text-[13px] font-semibold text-[#F47C8C]">Акция на это окно</dd>
            </div>
          </>
        ) : null}
      </dl>

      <div className={`${bookingMutedPanel} p-4`}>
        <p className={`${catalogDesktopSectionLabel} mb-2`}>Адрес</p>
        <MasterAddressBlock location={location} />
      </div>

      <div className="flex items-end justify-between gap-4">
        <span className="text-[14px] font-medium text-[#6B7280]">Стоимость</span>
        <div className="text-right">
          {slotPromo && slotPromo.discountedPrice < slotPromo.originalPrice ? (
            <span className="mr-2 text-[14px] font-medium text-[#9CA3AF] line-through">
              {pricePrefix}
              {Math.round(slotPromo.originalPrice)} BYN
            </span>
          ) : null}
          <span className="text-[24px] font-bold tracking-[-0.02em] text-[#111827]">
            {displayPrice <= 0 ? 'Бесплатно' : `${pricePrefix}${Math.round(displayPrice)} BYN`}
          </span>
        </div>
      </div>

      <BookingCheckoutExtras
        bookError={bookError}
        submitting={submitting}
        canConfirm={canConfirm}
        acceptedTerms={acceptedTerms}
        onAcceptedTermsChange={onAcceptedTermsChange}
        comment={comment}
        onCommentChange={onCommentChange}
        onConfirm={onConfirm}
      />
    </div>
  );
}
