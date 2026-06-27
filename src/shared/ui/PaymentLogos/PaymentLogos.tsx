import type { FC } from 'react';
import { PaymentDisclaimer } from './PaymentDisclaimer';
import { PaymentLogoImage } from './PaymentLogoImage';
import { PaymentLogosMarquee } from './PaymentLogosMarquee';
import {
  PAYMENT_DISCLAIMER_DEFAULT,
  PAYMENT_DISCLAIMER_SHORT,
  PAYMENT_METHODS,
  paymentLogoCompactHeightClass,
  paymentLogoHeightClass,
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

function footerLogoHeightClass(id: PaymentMethodId): string {
  return paymentLogoCompactHeightClass(id);
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
        <div className="grid grid-cols-3 items-end gap-x-3 gap-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-x-5 sm:gap-y-4">
          {methods.map((method) => (
            <PaymentLogoImage
              key={method.id}
              method={method}
              logoHeightClass={footerLogoHeightClass(method.id)}
              className={`shrink-0 ${method.id === 'belkart' ? 'col-span-2 sm:col-span-1' : ''}`}
            />
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
        <div className="flex flex-wrap items-end gap-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-end justify-center rounded-xl bg-[#FAFAFA] px-3 py-2 ring-1 ring-inset ring-black/[0.05]"
              title={method.caption}
            >
              <PaymentLogoImage
                method={method}
                logoHeightClass={paymentLogoCompactHeightClass(method.id)}
              />
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

  if (variant === 'legal') {
    return (
      <section className={className} aria-labelledby={title ? 'payment-logos-title' : undefined}>
        {title ? (
          <h2
            id="payment-logos-title"
            className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]"
          >
            {title}
          </h2>
        ) : null}
        {showDisclaimer ? (
          <PaymentDisclaimer tone="legal" className={title ? 'mt-2' : ''}>
            {disclaimer}
          </PaymentDisclaimer>
        ) : null}

        <PaymentLogosMarquee methods={methods} className={title || showDisclaimer ? 'mt-5' : ''} />
      </section>
    );
  }

  const gridClass =
    variant === 'cards' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5' : 'grid grid-cols-2 gap-3';

  return (
    <section className={className} aria-labelledby={title ? 'payment-logos-title' : undefined}>
      {title ? (
        <h2
          id="payment-logos-title"
          className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]"
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
            <div className="flex h-full flex-col rounded-[16px] bg-[#F5F5F5] px-3 py-3.5 sm:px-4 sm:py-4">
              <div className="flex min-h-[4.5rem] items-end justify-center pb-0.5 sm:min-h-[5rem]">
                <PaymentLogoImage
                  method={method}
                  logoHeightClass={paymentLogoHeightClass(method.id)}
                />
              </div>
              <p className="mt-3 text-center text-[12px] font-medium leading-snug text-[#6B7280]">
                {method.caption}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
