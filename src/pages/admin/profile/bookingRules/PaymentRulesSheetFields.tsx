import type { IconType } from 'react-icons';
import {
  HiBanknotes,
  HiCheck,
  HiCreditCard,
  HiDevicePhoneMobile,
  HiSparkles,
} from 'react-icons/hi2';
import { sheetFieldClass, sheetHintClass, sheetLabelClass } from '../adminProfileCabinetTheme';
import { PAYMENT_OPTIONS, type PaymentOption } from '../paymentMethodOptions';
import { needsPreferredBanks } from '../../../../shared/payments/paymentMethodCodes';
import { PreferredBanksPicker } from './PreferredBanksPicker';

export const PAYMENT_METHOD_VISUALS: Record<
  PaymentOption,
  { Icon: IconType; short: string; hint: string }
> = {
  Наличные: {
    Icon: HiBanknotes,
    short: 'На месте',
    hint: 'Клиент платит наличными после услуги',
  },
  Карта: {
    Icon: HiCreditCard,
    short: 'Терминал / перевод',
    hint: 'Оплата картой или по QR на месте',
  },
  Перевод: {
    Icon: HiDevicePhoneMobile,
    short: 'На карту',
    hint: 'Перевод на карту или по номеру телефона',
  },
  'Онлайн позже': {
    Icon: HiSparkles,
    short: 'Скоро в Slotty',
    hint: 'Онлайн-оплата появится в приложении',
  },
};

type PaymentMethodsGridProps = {
  selected: string[];
  onToggle: (method: PaymentOption) => void;
};

export function PaymentMethodsGrid({ selected, onToggle }: PaymentMethodsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PAYMENT_OPTIONS.map((opt) => {
        const on = selected.includes(opt);
        const isOnlineLater = opt === 'Онлайн позже';
        const { Icon, short } = PAYMENT_METHOD_VISUALS[opt];
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            disabled={isOnlineLater}
            onClick={() => !isOnlineLater && onToggle(opt)}
            className={`relative flex min-h-[6.75rem] flex-col items-start gap-2.5 rounded-[16px] border-0 p-3.5 text-left transition active:scale-[0.98] ${
              isOnlineLater
                ? 'cursor-not-allowed bg-[#F5F5F5] text-[#9CA3AF] opacity-70'
                : on
                  ? 'bg-[#F47C8C] text-white'
                  : 'bg-[#F5F5F5] text-[#111827] hover:bg-[#EBEBEB]'
            }`}
          >
            {isOnlineLater ? (
              <span className="absolute right-2.5 top-2.5 rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Скоро
              </span>
            ) : null}
            {on ? (
              <span
                className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/25"
                aria-hidden
              >
                <HiCheck className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${
                on ? 'bg-white/20 text-white' : 'bg-[#FFF1F4] text-[#F47C8C]'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 pr-4">
              <span
                className={`block text-[14px] font-bold leading-tight ${
                  on ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {opt}
              </span>
              <span
                className={`mt-0.5 block text-[11px] font-medium leading-snug ${
                  on ? 'text-white/85' : 'text-[#6B7280]'
                }`}
              >
                {short}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

type PaymentRulesSheetFieldsProps = {
  paymentMethods: string[];
  onTogglePaymentMethod: (method: PaymentOption) => void;
  preferredBankIds: string[];
  onTogglePreferredBank: (bankId: string) => void;
  paymentComment: string | null;
  onPaymentCommentChange: (value: string | null) => void;
};

export function PaymentRulesSheetFields({
  paymentMethods,
  onTogglePaymentMethod,
  preferredBankIds,
  onTogglePreferredBank,
  paymentComment,
  onPaymentCommentChange,
}: PaymentRulesSheetFieldsProps) {
  return (
    <>
      <div>
        <p className={sheetLabelClass}>Способы оплаты</p>
        <p className={`mt-1 ${sheetHintClass}`}>
          Выберите один или несколько — клиент увидит иконки и подписи
        </p>
        <div className="mt-3">
          <PaymentMethodsGrid selected={paymentMethods} onToggle={onTogglePaymentMethod} />
        </div>
      </div>

      <PreferredBanksPicker
        paymentMethods={paymentMethods}
        selectedBankIds={needsPreferredBanks(paymentMethods) ? preferredBankIds : []}
        onToggleBank={onTogglePreferredBank}
      />

      <label className="mt-5 block">
        <span className={sheetLabelClass}>Комментарий</span>
        <p className={`mt-1 ${sheetHintClass}`}>
          Уточните детали: реквизиты, когда платить, нужен ли чек
        </p>
        <textarea
          value={paymentComment ?? ''}
          onChange={(e) => onPaymentCommentChange(e.target.value || null)}
          rows={3}
          placeholder="Например: оплата после услуги, перевод на карту Приорбанка"
          className={`${sheetFieldClass} mt-2 resize-none leading-relaxed`}
        />
      </label>
    </>
  );
}

/** Иконка способа оплаты для карточек просмотра. */
export function PaymentMethodIcon({
  method,
  className = 'h-4 w-4',
}: {
  method: string;
  className?: string;
}) {
  const visual = PAYMENT_METHOD_VISUALS[method as PaymentOption];
  if (!visual) return null;
  const { Icon } = visual;
  return <Icon className={className} aria-hidden />;
}
