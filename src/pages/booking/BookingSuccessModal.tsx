import { Link } from 'react-router-dom';
import { HiCheck, HiDocumentArrowDown } from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { getProfilePath, SERVICES_PATH } from '../../app/paths';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import { clientOutlineBtn, clientPinkBtn } from '../client/clientTheme';
import { bookingMutedPanel } from './bookingUi';
import type { BookingSuccessPayload } from './bookingTypes';

type Props = {
  success: BookingSuccessPayload;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[14px] leading-snug">
      <span className="shrink-0 text-[#6B7280]">{label}</span>
      <span className="text-right font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function SuccessBrandLogo({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[18px] bg-white shadow-[0_8px_24px_rgba(244,124,140,0.12)] ring-1 ring-[#FDE8ED] ${
        compact ? 'px-4 py-2.5' : 'px-5 py-3'
      }`}
    >
      <img
        src={HEADER_LOGO_SRC}
        alt="SLOTTY"
        width={160}
        height={48}
        decoding="async"
        className={`w-auto object-contain ${compact ? 'h-9' : 'h-11 sm:h-12'}`}
      />
    </div>
  );
}

export function BookingSuccessCelebration({ compact }: { compact?: boolean }) {
  const circleSize = compact ? 'h-16 w-16' : 'h-[4.75rem] w-[4.75rem]';
  const iconSize = compact ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-2' : ''}`}>
      <SuccessBrandLogo compact={compact} />
      <div
        className={`relative mt-4 flex ${circleSize} items-center justify-center rounded-full bg-gradient-to-br from-[#F47C8C] to-[#F26D83] shadow-[0_14px_40px_rgba(244,124,140,0.38)]`}
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full ring-4 ring-[#FFF1F4]" />
        <HiCheck className={`${iconSize} relative text-white`} strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function BookingSuccessModal({ success }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[3px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-success-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(17,24,39,0.18)]"
      >
        <div className="bg-gradient-to-b from-[#FFF8F9] via-[#FFF1F4] to-white px-6 pb-2 pt-7 sm:pt-8">
          <BookingSuccessCelebration />
          <h2
            id="booking-success-title"
            className="mt-4 text-center text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#111827] sm:text-[24px]"
          >
            Запись подтверждена
          </h2>
          <p className="mt-2 text-center text-[15px] leading-snug text-[#6B7280]">
            Напомним о визите в Telegram
          </p>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className={`${bookingMutedPanel} space-y-3 p-4`}>
            <SummaryRow label="Мастер" value={success.masterName} />
            <SummaryRow label="Услуга" value={success.serviceTitle} />
            <div className="flex justify-between gap-3 text-[14px] leading-snug">
              <span className="shrink-0 text-[#6B7280]">Когда</span>
              <span className="text-right font-semibold capitalize text-[#111827]">
                {success.dateLabel}, {success.timeLabel}
              </span>
            </div>
            {success.locationLine?.trim() ? (
              <div className="border-t border-[#F3F4F6] pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Адрес
                </p>
                <p className="mt-1 text-[14px] font-medium leading-snug text-[#374151]">
                  {success.locationLine}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-2.5">
            <Link
              to={getProfilePath('appointments')}
              className={`${clientPinkBtn} w-full min-h-[52px] text-[15px]`}
            >
              Мои записи
            </Link>
            <button
              type="button"
              onClick={() =>
                openBookingVoucherPrint(
                  {
                    masterName: success.masterName,
                    serviceTitle: success.serviceTitle,
                    dateLabel: success.dateLabel,
                    timeLabel: success.timeLabel,
                    locationLine: success.locationLine,
                  },
                  HEADER_LOGO_SRC,
                )
              }
              className="flex w-full min-h-12 items-center justify-center gap-3 rounded-full border border-[#FDE8ED] bg-white px-4 text-[15px] font-semibold text-[#111827] shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition hover:border-[#F47C8C]/40 hover:bg-[#FFFBFC] active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
                <HiDocumentArrowDown className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-left leading-tight">
                Скачать подтверждение
                <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">PDF для печати</span>
              </span>
            </button>
            <Link to={SERVICES_PATH} className={`${clientOutlineBtn} w-full min-h-11 text-[15px]`}>
              К услугам
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
