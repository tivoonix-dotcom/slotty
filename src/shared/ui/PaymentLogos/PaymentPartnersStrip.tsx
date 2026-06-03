import type { FC } from 'react';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { PaymentLogoImage } from './PaymentLogoImage';
import { PAYMENT_METHODS, type PaymentMethodId } from './paymentLogosConfig';

const BEPAID_METHOD = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

const CARD_METHOD_IDS: PaymentMethodId[] = ['visa', 'mastercard', 'belkart'];

type Props = {
  className?: string;
  /** Короткая подпись над логотипами. */
  title?: string;
  showCards?: boolean;
};

/** SLOTTY × bePaid — для лендинга и экранов оплаты. */
export const PaymentPartnersStrip: FC<Props> = ({
  className = '',
  title = 'Оплата тарифа Pro',
  showCards = true,
}) => {
  const cardMethods = PAYMENT_METHODS.filter((m) => CARD_METHOD_IDS.includes(m.id));

  return (
    <div className={`mx-auto w-full max-w-[28rem] ${className}`}>
      {title ? (
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
          {title}
        </p>
      ) : null}

      <div
        className={`flex items-center justify-center gap-4 rounded-[22px] bg-white px-5 py-4 ring-1 ring-[#E8EAED] shadow-[0_8px_30px_rgba(17,24,39,0.05)] ${
          title ? 'mt-4' : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center justify-end pr-1">
          <img
            src={HEADER_LOGO_SRC}
            alt="SLOTTY"
            width={140}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-9 w-auto max-w-[7.5rem] object-contain object-right sm:h-10"
          />
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF8F9] text-[11px] font-bold text-[#E29595] ring-1 ring-[#FDE8ED]"
          aria-hidden
        >
          ×
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-start pl-1">
          <div className="flex h-11 w-full max-w-[8.5rem] items-center justify-center rounded-[14px] bg-[#FAFAFA] px-3 ring-1 ring-inset ring-black/[0.05]">
            <PaymentLogoImage method={BEPAID_METHOD} logoHeightClass="h-7 w-auto max-w-[6.5rem] sm:h-8" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[13px] leading-relaxed text-[#6B7280]">
        Защищённая оплата на странице bePaid · BYN · 3-D Secure
      </p>

      {showCards ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {cardMethods.map((method) => (
            <div
              key={method.id}
              className="flex h-8 items-center justify-center rounded-lg bg-[#FAFAFA] px-2.5 ring-1 ring-inset ring-black/[0.05]"
              title={method.caption}
            >
              <PaymentLogoImage method={method} logoHeightClass="h-4 w-auto max-w-[3.5rem]" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
