import type { FC } from 'react';
import { HiCheck, HiShieldCheck, HiSparkles } from 'react-icons/hi2';
import { billingPinkBtn } from '../admin/billing/adminBillingTheme';
import { LANDING_MASTER_PRO_FEATURES } from '../../features/billing/ui/landingTariffCards';
import { PaymentPartnersStrip } from '../../shared/ui/PaymentLogos';
import { legalFlowDemoFlatCard, legalFlowDemoSoftCard } from './legalFlowDemoTheme';

const PRO_AMOUNT = '45 BYN';
const PRO_FEATURES_PREVIEW = LANDING_MASTER_PRO_FEATURES.slice(0, 3);

type TariffPanelProps = {
  confirmed: boolean;
  pressing: boolean;
};

/** Шаг 1 — кабинет мастера, выбор Pro. */
export const PaymentFlowTariffPanel: FC<TariffPanelProps> = ({ confirmed, pressing }) => (
  <div className="w-full min-w-0 space-y-3">
    <p className="text-center font-hero-display text-[15px] font-medium text-[#111827] sm:text-[16px]">
      Кабинет · Тариф и оплата
    </p>

    <div className="grid grid-cols-2 gap-1 rounded-[12px] bg-[#EBEBEB] p-1">
      <div className="flex min-h-10 items-center justify-center rounded-[10px] font-landing text-[13px] font-semibold text-[#6B7280]">
        Free
      </div>
      <div className="flex min-h-10 items-center justify-center rounded-[10px] bg-white font-landing text-[13px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]">
        Pro
      </div>
    </div>

    <div className={`${legalFlowDemoFlatCard} ${confirmed ? 'ring-2 ring-[#F47C8C]/40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiSparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="font-hero-display text-[15px] font-medium text-[#111827]">Мастер Pro</p>
            <p className="font-landing text-[12px] text-[#6B7280]">45 BYN / месяц</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#111827] px-2 py-0.5 font-landing text-[10px] font-semibold text-white">
          Популярный
        </span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {PRO_FEATURES_PREVIEW.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 font-landing text-[12px] leading-snug text-[#374151] sm:text-[13px]"
          >
            <HiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#111827]" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {confirmed ? (
        <p className="mt-4 animate-fade-enter font-landing text-[13px] text-[#047857]">
          Тариф выбран — откроется окно оплаты.
        </p>
      ) : (
        <button
          type="button"
          data-payment-demo-tariff
          tabIndex={-1}
          aria-hidden
          className={`mt-4 w-full min-h-[2.75rem] text-[14px] ${billingPinkBtn} ${pressing ? 'scale-[0.98]' : ''}`}
        >
          Подключить Pro
        </button>
      )}
    </div>
  </div>
);

type CheckoutPanelProps = {
  pressing: boolean;
};

/** Шаг 2 — экран «Перейти к оплате» в кабинете (как ProBePaidPaymentSheet). */
export const PaymentFlowCheckoutPanel: FC<CheckoutPanelProps> = ({ pressing }) => (
  <div className="w-full min-w-0 space-y-3">
    <div className="text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">К оплате</p>
      <p className="mt-1 font-hero-display text-[24px] font-medium tracking-[-0.03em] text-[#111827] sm:text-[26px]">
        {PRO_AMOUNT}
      </p>
      <p className="mt-1 font-landing text-[12px] text-[#6B7280]">Подписка Pro · 1 месяц</p>
    </div>

    <section className={legalFlowDemoSoftCard}>
      <PaymentPartnersStrip className="py-0.5" />

      <ul className="mt-4 space-y-2 text-left font-landing text-[12px] leading-snug text-[#374151] sm:text-[13px]">
        <li className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[10px] font-bold text-[#F47C8C]">
            1
          </span>
          <span>Нажмите «Перейти к оплате»</span>
        </li>
        <li className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[10px] font-bold text-[#F47C8C]">
            2
          </span>
          <span>Откроется защищённая страница bePaid</span>
        </li>
        <li className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[10px] font-bold text-[#F47C8C]">
            3
          </span>
          <span>Введите данные карты и подтвердите платёж</span>
        </li>
      </ul>

      <button
        type="button"
        data-payment-demo-checkout
        tabIndex={-1}
        aria-hidden
        className={`mt-4 w-full min-h-[2.75rem] text-[14px] sm:mt-5 sm:min-h-[3rem] sm:text-[15px] ${billingPinkBtn} ${
          pressing ? 'scale-[0.98]' : ''
        }`}
      >
        Перейти к оплате
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 font-landing text-[11px] font-medium text-[#9CA3AF] sm:text-[12px]">
        <HiShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#F47C8C]" aria-hidden />
        Безопасная оплата через bePaid
      </p>
    </section>
  </div>
);

type CardFieldId = 'card' | 'expiry' | 'cvc';

type BePaidPanelProps = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  activeField: CardFieldId | null;
  typing: boolean;
  pressing: boolean;
};

function DemoCardField({
  id,
  label,
  value,
  placeholder,
  active,
  typing,
}: {
  id: CardFieldId;
  label: string;
  value: string;
  placeholder: string;
  active: boolean;
  typing: boolean;
}) {
  return (
    <div
      data-payment-demo-field={id}
      className={[
        'rounded-[12px] px-3 py-2.5 ring-1 transition',
        active ? 'bg-white ring-[#F47C8C]' : 'bg-[#F5F5F5] ring-[#EEEEEE]',
      ].join(' ')}
    >
      <p className="font-landing text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p
        className={`mt-0.5 min-h-[1.25rem] font-landing text-[13px] sm:text-[14px] ${
          value ? 'text-[#111827]' : 'text-[#9CA3AF]'
        }`}
      >
        {value || placeholder}
        {typing && active ? (
          <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-[#111827]" aria-hidden />
        ) : null}
      </p>
    </div>
  );
}

/** Шаг 3 — форма bePaid с подсветкой полей и вводом. */
export const PaymentFlowBePaidPanel: FC<BePaidPanelProps> = ({
  cardNumber,
  expiry,
  cvc,
  activeField,
  typing,
  pressing,
}) => (
  <div className="w-full min-w-0 space-y-3">
    <div className={legalFlowDemoFlatCard}>
      <div className="flex items-center justify-between gap-2">
        <PaymentPartnersStrip className="!justify-start py-0" />
        <span className="shrink-0 font-landing text-[12px] font-semibold text-[#111827]">{PRO_AMOUNT}</span>
      </div>

      <p className="mt-3 font-landing text-[12px] font-medium text-[#6B7280] sm:text-[13px]">
        Введите данные банковской карты. SLOTTY не сохраняет номер, срок и CVC.
      </p>

      <div className="mt-4 space-y-2.5">
        <DemoCardField
          id="card"
          label="Номер карты"
          value={cardNumber}
          placeholder="0000 0000 0000 0000"
          active={activeField === 'card'}
          typing={typing}
        />
        <div className="grid grid-cols-2 gap-2">
          <DemoCardField
            id="expiry"
            label="Срок"
            value={expiry}
            placeholder="ММ / ГГ"
            active={activeField === 'expiry'}
            typing={typing}
          />
          <DemoCardField
            id="cvc"
            label="CVC"
            value={cvc}
            placeholder="•••"
            active={activeField === 'cvc'}
            typing={typing}
          />
        </div>
      </div>

      <button
        type="button"
        data-payment-demo-submit
        tabIndex={-1}
        aria-hidden
        className={`mt-4 w-full min-h-[2.75rem] text-[14px] ${billingPinkBtn} ${pressing ? 'scale-[0.98]' : ''}`}
      >
        Оплатить {PRO_AMOUNT}
      </button>
    </div>

    <p className="text-center font-landing text-[11px] leading-relaxed text-[#9CA3AF] sm:text-[12px]">
      После подтверждения банком вы вернётесь в SLOTTY
    </p>
  </div>
);

/** Шаг 4 — подписка активирована. */
export const PaymentFlowProSuccessPanel: FC = () => (
  <div className="w-full min-w-0 animate-fade-enter space-y-3">
    <p className="rounded-[18px] bg-[#ECFDF5] px-4 py-4 font-landing text-[13px] font-semibold leading-relaxed text-[#047857] ring-1 ring-[#A7F3D0] sm:text-[14px]">
      Pro активен. Статус обновится после подтверждения банком — обычно в течение нескольких минут.
    </p>
    <div className={legalFlowDemoSoftCard}>
      <p className="text-center font-hero-display text-[15px] font-medium text-[#111827] sm:text-[16px]">
        Оплата принята
      </p>
      <p className="mt-1 text-center font-landing text-[12px] text-[#6B7280] sm:text-[13px]">
        {PRO_AMOUNT} · подписка Pro · мастер
      </p>
      <div className="mt-4 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 py-1.5 font-landing text-[11px] font-semibold text-[#F47C8C] sm:text-[12px]">
          <HiShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Безлимит услуг и записей
        </span>
      </div>
    </div>
  </div>
);
