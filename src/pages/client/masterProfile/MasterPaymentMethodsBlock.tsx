import { useState } from 'react';
import { resolveBelarusBanks } from '../../../shared/payments/belarusBanks';
import {
  PAYMENT_METHOD_LABELS,
  type MasterPublicPaymentDto,
  type PaymentMethodCode,
} from '../../../shared/payments/paymentMethodCodes';
import { PaymentMethodIcon } from '../../admin/profile/bookingRules/PaymentRulesSheetFields';

type Props = {
  methods?: string[];
  payment?: MasterPublicPaymentDto | null;
  note?: string;
  preferredBankIds?: string[];
  compact?: boolean;
  variant?: 'default' | 'sheet';
  showComment?: boolean;
  maxVisibleBanks?: number;
};

function paymentMethodLabel(method: string): string {
  const code = method as PaymentMethodCode;
  return PAYMENT_METHOD_LABELS[code] ?? method;
}

function BankChip({
  name,
  logoSrc,
  variant,
}: {
  name: string;
  logoSrc: string;
  variant: 'default' | 'sheet';
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const chipClass =
    variant === 'sheet'
      ? 'inline-flex items-center gap-2 rounded-[12px] bg-[#F6F7FB] px-3 py-2 text-[13px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]'
      : 'inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#111827] ring-1 ring-[#FDE8ED]';

  return (
    <span className={chipClass}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#EEEEEE]">
        {!logoFailed ? (
          <img
            src={logoSrc}
            alt=""
            className="h-4 w-4 object-contain"
            loading="lazy"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="text-[9px] font-bold text-[#9CA3AF]">{name.slice(0, 1)}</span>
        )}
      </span>
      {name}
    </span>
  );
}

export function MasterPaymentMethodsBlock({
  methods = [],
  payment,
  note,
  preferredBankIds,
  compact = false,
  variant = 'default',
  showComment = true,
  maxVisibleBanks = 4,
}: Props) {
  const resolvedMethods = payment?.methods?.length
    ? payment.methods.map(paymentMethodLabel)
    : methods.filter((m) => m.trim());
  const resolvedBankIds = payment?.preferredBankIds?.length
    ? payment.preferredBankIds
    : (preferredBankIds ?? []);
  const resolvedNote = payment?.comment?.trim() || note?.trim() || '';
  const banks = resolveBelarusBanks(resolvedBankIds);
  const visibleBanks = banks.slice(0, maxVisibleBanks);
  const hiddenBankCount = Math.max(0, banks.length - visibleBanks.length);

  const chipClass =
    variant === 'sheet'
      ? 'inline-flex items-center gap-2 rounded-[12px] bg-[#F6F7FB] px-3 py-2 text-[14px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]'
      : 'inline-flex items-center gap-2 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#111827] ring-1 ring-[#FDE8ED]';

  if (!resolvedMethods.length && !resolvedNote && !banks.length) {
    return null;
  }

  return (
    <div className={compact && variant === 'default' ? 'mt-3' : undefined}>
      {resolvedMethods.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {resolvedMethods.map((method) => (
            <span key={method} className={chipClass}>
              <span className="text-[#F47C8C]">
                <PaymentMethodIcon method={method} className="h-4 w-4" />
              </span>
              {method}
            </span>
          ))}
        </div>
      ) : null}

      {banks.length > 0 ? (
        <div className={resolvedMethods.length ? 'mt-3' : ''}>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Удобные банки
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleBanks.map((bank) => (
              <BankChip key={bank.id} name={bank.name} logoSrc={bank.logoSrc} variant={variant} />
            ))}
            {hiddenBankCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]">
                + ещё {hiddenBankCount}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showComment && resolvedNote ? (
        <p
          className={`whitespace-pre-wrap text-[14px] leading-relaxed text-[#6B7280] ${
            resolvedMethods.length || banks.length ? 'mt-3 rounded-[12px] bg-[#FAFAFA] px-3 py-2.5 ring-1 ring-[#F3F4F6]' : ''
          }`}
        >
          {resolvedNote.startsWith('Комментарий') ? resolvedNote : `Комментарий мастера: ${resolvedNote}`}
        </p>
      ) : null}
    </div>
  );
}
