import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { HiArrowDownTray, HiXMark } from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { getProfilePath, SERVICES_PATH } from '../../app/paths';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import { billingOutlineBtn, billingPinkBtn } from '../admin/billing/adminBillingTheme';
import { SUBSCRIPTION_RECEIPT_BG_SRC } from '../admin/settings/workspace/billing/subscriptionReceiptModel';
import type { BookingSuccessPayload } from './bookingTypes';

type Props = {
  success: BookingSuccessPayload;
};

function lockBackgroundScroll() {
  const roots: HTMLElement[] = [
    document.documentElement,
    document.body,
    ...Array.from(document.querySelectorAll<HTMLElement>('main.overflow-y-auto')),
  ];

  const prev = roots.map((el) => ({
    el,
    overflow: el.style.overflow,
    overscrollBehavior: el.style.overscrollBehavior,
  }));

  for (const el of roots) {
    el.style.overflow = 'hidden';
    el.style.overscrollBehavior = 'none';
  }

  return () => {
    for (const { el, overflow, overscrollBehavior } of prev) {
      el.style.overflow = overflow;
      el.style.overscrollBehavior = overscrollBehavior;
    }
  };
}

function buildBookingReceiptRows(success: BookingSuccessPayload) {
  const rows = [
    { label: 'Мастер', value: success.masterName },
    { label: 'Услуга', value: success.serviceTitle },
    {
      label: 'Когда',
      value: `${success.dateLabel}, ${success.timeLabel}`,
    },
  ];

  if (success.locationLine?.trim()) {
    rows.push({ label: 'Адрес', value: success.locationLine.trim() });
  }

  return rows;
}

/** Компактный блок для sheet «Заявка отправлена» — без розового чекмарка. */
export function BookingSuccessCelebration({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-[#F3F4F6] ${compact ? '' : 'mx-auto max-w-sm'}`}
    >
      <img
        src={SUBSCRIPTION_RECEIPT_BG_SRC}
        alt=""
        className={`block w-full object-cover object-center ${compact ? 'aspect-[2.6/1]' : 'aspect-[2.4/1]'}`}
      />
      <div className={`bg-white ${compact ? 'p-3' : 'p-4'}`}>
        <p
          className={`font-extrabold tracking-[-0.03em] text-[#111827] ${compact ? 'text-[16px]' : 'text-[18px]'}`}
        >
          SLOTTY
        </p>
        <p className={`mt-1 text-[#6B7280] ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
          Онлайн-запись к мастерам
        </p>
      </div>
    </div>
  );
}

export function BookingSuccessModal({ success }: Props) {
  const rows = buildBookingReceiptRows(success);
  const issuedAt = new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const whenLine = `${success.dateLabel}, ${success.timeLabel}`;

  useEffect(() => {
    const unlockScroll = lockBackgroundScroll();

    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });

    return () => {
      unlockScroll();
      document.removeEventListener('wheel', blockBackgroundScroll);
      document.removeEventListener('touchmove', blockBackgroundScroll);
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      role="presentation"
    >
      <div className="absolute inset-0 overflow-hidden bg-black/65 backdrop-blur-[2px] overscroll-none" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-success-title"
        className="relative z-10 flex max-h-[min(85vh,36rem)] w-full max-w-[30rem] flex-col overflow-hidden rounded-[20px] border border-[#ebebeb] bg-white sm:max-w-[32rem]"
      >
        <header className="shrink-0 border-b border-[#F3F4F6] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Подтверждение записи
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2
                  id="booking-success-title"
                  className="text-[20px] font-extrabold tracking-[-0.03em] text-[#111827]"
                >
                  Запись подтверждена
                </h2>
                <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                  Подтверждено
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                Напомним о визите в Telegram · {issuedAt}
              </p>
            </div>
            <Link
              to={SERVICES_PATH}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EBEBEB] hover:text-[#111827]"
              aria-label="Закрыть"
            >
              <HiXMark className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="overflow-hidden rounded-[16px] border border-[#F3F4F6]">
            <img
              src={SUBSCRIPTION_RECEIPT_BG_SRC}
              alt=""
              className="block aspect-[2.4/1] w-full object-cover object-center"
            />
            <div className="p-4">
              <p className="text-[18px] font-extrabold tracking-[-0.03em] text-[#111827]">
                {success.serviceTitle}
              </p>
              <p className="mt-1 text-[26px] font-black capitalize tracking-[-0.04em] text-[#111827]">
                {whenLine}
              </p>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                {success.masterName} · SLOTTY
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[16px] border border-[#F3F4F6]">
            <p className="border-b border-[#F3F4F6] bg-[#FAFAFA] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#6B7280]">
              Детали записи
            </p>
            <dl>
              {rows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] px-4 py-3 text-[13px] last:border-b-0"
                >
                  <dt className="shrink-0 text-[#6B7280]">{label}</dt>
                  <dd className="text-right font-semibold capitalize text-[#111827]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-5 flex items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
            <span className="font-extrabold tracking-[0.12em] text-[#ff5f7a]">SLOTTY</span>
            <span>slotty.by</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[#F3F4F6] bg-[#FAFAFA] px-5 py-4 sm:flex-row sm:px-6">
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
            className={`inline-flex flex-1 items-center justify-center gap-2 ${billingOutlineBtn}`}
          >
            <HiArrowDownTray className="h-4 w-4 shrink-0" aria-hidden />
            Скачать PDF
          </button>
          <Link to={getProfilePath('appointments')} className={`flex-1 ${billingPinkBtn}`}>
            Мои записи
          </Link>
        </div>

        <div className="shrink-0 border-t border-[#F3F4F6] bg-white px-5 py-3 sm:px-6">
          <Link
            to={SERVICES_PATH}
            className={`inline-flex w-full items-center justify-center ${billingOutlineBtn}`}
          >
            К услугам
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
