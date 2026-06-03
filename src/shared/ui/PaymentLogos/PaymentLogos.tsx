import type { FC } from 'react';
import { PaymentDisclaimer } from './PaymentDisclaimer';
import { PaymentLogoImage } from './PaymentLogoImage';
import {
  PAYMENT_DISCLAIMER_DEFAULT,
  PAYMENT_DISCLAIMER_SHORT,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from './paymentLogosConfig';

export type PaymentLogosVariant = 'compact' | 'cards' | 'footer' | 'legal';

type Props = {
  variant?: PaymentLogosVariant;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  title?: string;
  /** Subset of methods; default — all. */
  methods?: PaymentMethodId[];
  className?: string;
};

function resolveMethods(ids?: PaymentMethodId[]) {
  if (!ids?.length) return PAYMENT_METHODS;
  const set = new Set(ids);
  return PAYMENT_METHODS.filter((m) => set.has(m.id));
}

export const PaymentLogos: FC<Props> = ({
  variant = 'cards',
  showDisclaimer = true,
  disclaimerText,
  title,
  methods: methodIds,
  className = '',
}) => {
  const methods = resolveMethods(methodIds);
  const disclaimer =
    disclaimerText ??
    (variant === 'footer' || variant === 'compact' ? PAYMENT_DISCLAIMER_SHORT : PAYMENT_DISCLAIMER_DEFAULT);

  if (variant === 'footer') {
    return (
      <div className={className}>
        {title ? (
          <p className="mb-2 text-[12px] font-semibold tracking-[0.06em] text-[#171717]/55">{title}</p>
        ) : null}
        <div className="-mx-1 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin sm:gap-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex h-12 min-w-[5.75rem] shrink-0 items-center justify-center rounded-xl bg-white/20 px-3 ring-1 ring-inset ring-black/8 transition hover:bg-white/28 sm:h-[3.25rem] sm:min-w-[6.25rem] sm:px-3.5"
              title={method.caption}
            >
              <PaymentLogoImage
                method={method}
                logoHeightClass="h-7 w-auto max-w-[5.75rem] sm:h-8 sm:max-w-[6.5rem]"
              />
            </div>
          ))}
        </div>
        {showDisclaimer ? (
          <PaymentDisclaimer tone="footer" className="mt-2">
            {disclaimer}
          </PaymentDisclaimer>
        ) : null}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-[20px] border border-black/[0.06] bg-white/80 px-4 py-3 ${className}`}
      >
        {title ? (
          <p className="mb-2 text-[13px] font-semibold text-neutral-800">{title}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex h-10 items-center justify-center rounded-xl bg-[#FAFAFA] px-3 ring-1 ring-inset ring-black/[0.05]"
              title={method.caption}
            >
              <PaymentLogoImage method={method} logoHeightClass="h-6 w-auto max-w-[5.5rem]" />
            </div>
          ))}
        </div>
        {showDisclaimer ? (
          <PaymentDisclaimer tone="light" className="mt-2.5">
            {disclaimer}
          </PaymentDisclaimer>
        ) : null}
      </div>
    );
  }

  const isLegal = variant === 'legal';
  const gridClass =
    isLegal || variant === 'cards'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid grid-cols-2 gap-3';

  return (
    <section
      className={`rounded-[24px] border border-black/[0.06] bg-[#FFFBFB] px-4 py-5 sm:px-6 sm:py-6 ${className}`}
      aria-labelledby={title ? 'payment-logos-title' : undefined}
    >
      {title ? (
        <h2
          id="payment-logos-title"
          className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-950"
        >
          {title}
        </h2>
      ) : null}
      {showDisclaimer ? (
        <PaymentDisclaimer tone="legal" className={title ? 'mt-2' : ''}>
          {disclaimer}
        </PaymentDisclaimer>
      ) : null}

      <ul className={`${title || showDisclaimer ? 'mt-5' : ''} ${gridClass}`}>
        {methods.map((method) => (
          <li key={method.id}>
            <div className="group flex h-full flex-col rounded-[18px] border border-black/[0.06] bg-white px-3 py-3.5 transition hover:border-[#E29595]/35 hover:bg-[#FFF8F8] sm:px-4 sm:py-4">
              <div className="flex min-h-[2.75rem] items-center justify-center sm:min-h-[3rem]">
                <PaymentLogoImage
                  method={method}
                  logoHeightClass="h-7 w-auto max-w-[6.5rem] sm:h-8"
                />
              </div>
              <p className="mt-3 text-center text-[12px] font-medium leading-snug text-neutral-600">
                {method.caption}
              </p>
              {method.isPlaceholderAsset ? (
                <p className="mt-1 text-center text-[10px] text-neutral-400">логотип — уточняется</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
