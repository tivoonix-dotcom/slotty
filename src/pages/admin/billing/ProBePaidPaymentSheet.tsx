import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck } from 'react-icons/hi2';
import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import type { MasterSubscriptionDto } from '../../../features/admin/api/adminBillingApi';
import {
  getProManualPaymentState,
  type MasterProCabinetStatus,
} from '../../../features/billing/api/proPaymentRequestApi';
import { createBePaidPayment } from '../../../features/payments/api/bepaidApi';
import { LEGAL_PAYMENT_PATH, LEGAL_REFUND_PATH, PAYMENT_SUCCESS_PATH } from '../../../app/paths';
import { readPublicAppOrigin } from '../../../shared/lib/masterBookingLink';
import { PaymentLogos } from '../../../shared/ui/PaymentLogos';
import { PaymentLogoImage } from '../../../shared/ui/PaymentLogos/PaymentLogoImage';
import { PAYMENT_METHODS } from '../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { billingPinkBtn } from './adminBillingTheme';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';

const BEPAID_METHOD = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

type Props = {
  billingPeriod: BillingPeriod;
  amountLabel: string;
  subscription: MasterSubscriptionDto | null;
  showMockDemo?: boolean;
  onBack: () => void;
  onMockDemo?: () => void | Promise<void>;
};

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function ProBePaidPaymentSheet({
  billingPeriod,
  amountLabel,
  subscription,
  showMockDemo = false,
  onBack,
  onMockDemo,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proStatus, setProStatus] = useState<MasterProCabinetStatus>('free');
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [pendingManual, setPendingManual] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = await getProManualPaymentState(billingPeriod);
      setProStatus(st.proStatus);
      setProExpiresAt(st.proExpiresAt);
      setPendingManual(Boolean(st.pendingRequest));
    } catch {
      setProStatus('free');
      setPendingManual(false);
    } finally {
      setLoading(false);
    }
  }, [billingPeriod]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isActivePro = proStatus === 'active';
  const proExpiresLabel = formatDate(proExpiresAt ?? subscription?.currentPeriodEnd ?? null);
  const periodLabel = billingPeriod === 'year' ? 'год' : 'месяц';

  async function handlePay() {
    setPayLoading(true);
    setError(null);
    try {
      const origin = readPublicAppOrigin();
      const returnUrl = `${origin}${PAYMENT_SUCCESS_PATH}?from=pro`;
      const result = await createBePaidPayment({
        type: 'MASTER_PRO_PLAN',
        billingPeriod,
        currency: 'BYN',
        returnUrl,
      });
      const url = result.checkout?.redirectUrl?.trim();
      if (!url) {
        setError('Не получена ссылка на оплату. Попробуйте позже.');
        return;
      }
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось создать платёж';
      if (msg.includes('временно недоступна') || msg.includes('BEPAID_DISABLED')) {
        setError('Онлайн-оплата временно недоступна. Попробуйте позже или напишите в поддержку.');
      } else if (msg.includes('уже активен') || msg.includes('PRO_ALREADY_ACTIVE')) {
        setError('Тариф Pro уже активен');
      } else {
        setError(msg);
      }
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-[14px] text-[#6B7280]">Загрузка…</p>;
  }

  if (isActivePro) {
    return (
      <div className="space-y-4">
        <p className="rounded-[18px] bg-[#ECFDF5] px-4 py-4 text-[14px] font-semibold leading-relaxed text-[#047857] ring-1 ring-[#A7F3D0]">
          Pro уже активен{proExpiresLabel ? ` до ${proExpiresLabel}` : ''}.
        </p>
        <button type="button" onClick={onBack} className={`${billingPinkBtn} min-h-12 w-full`}>
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingManual ? (
        <p className="rounded-[18px] bg-[#FFFBEB] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#92400E] ring-1 ring-[#FDE68A]">
          У вас есть заявка на ручную проверку оплаты. Дождитесь ответа или обратитесь в поддержку перед
          новой оплатой картой.
        </p>
      ) : null}

      <div className="text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
          Тариф · {periodLabel}
        </p>
        <p className="mt-1 text-[28px] font-black tracking-[-0.04em] text-[#111827]">{amountLabel}</p>
      </div>

      <section className="overflow-hidden rounded-[22px] bg-gradient-to-b from-[#FFF8F9] to-white p-5 ring-1 ring-[#FDE8ED]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 items-center justify-center rounded-[16px] bg-white px-5 shadow-[0_8px_24px_rgba(244,124,140,0.12)] ring-1 ring-[#FDE8ED]">
            <PaymentLogoImage method={BEPAID_METHOD} logoHeightClass="h-8 w-auto max-w-[7rem]" />
          </div>
          <p className="mt-3 text-[12px] font-medium text-[#6B7280]">Платёжный провайдер · BYN · 3-D Secure</p>
        </div>

        <PaymentLogos
          variant="compact"
          showDisclaimer={false}
          title="Принимаем"
          methods={['visa', 'mastercard', 'belkart']}
          className="mt-5"
        />

        <ul className="mt-5 space-y-2.5 text-left text-[14px] leading-snug text-[#374151]">
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[12px] font-bold text-[#F47C8C]">
              1
            </span>
            <span>Нажмите «Перейти к оплате» — откроется защищённая страница bePaid</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[12px] font-bold text-[#F47C8C]">
              2
            </span>
            <span>Оплатите картой. Данные карты не сохраняются в SLOTTY</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[12px] font-bold text-[#F47C8C]">
              3
            </span>
            <span>Pro включится автоматически после подтверждения банком (не сразу на странице «успех»)</span>
          </li>
        </ul>

        <button
          type="button"
          disabled={payLoading || pendingManual}
          onClick={() => void handlePay()}
          className={`mt-6 w-full min-h-[3.25rem] ${billingPinkBtn} text-[16px] disabled:opacity-50`}
        >
          {payLoading ? 'Создаём платёж…' : 'Перейти к оплате'}
        </button>

        {error ? (
          <p className="mt-3 rounded-[14px] bg-[#FEF2F2] px-3 py-2.5 text-center text-[13px] font-medium text-[#DC2626]">
            {error}
          </p>
        ) : null}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#9CA3AF]">
          <HiShieldCheck className="h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
          Безопасная оплата через bePaid
        </p>
      </section>

      <p className="text-center text-[12px] leading-relaxed text-[#9CA3AF]">
        <Link to={LEGAL_PAYMENT_PATH} className="font-semibold text-[#E29595] hover:underline">
          Правила оплаты
        </Link>
        {' · '}
        <Link to={LEGAL_REFUND_PATH} className="font-semibold text-[#E29595] hover:underline">
          Возврат средств
        </Link>
      </p>

      <button type="button" onClick={onBack} className={`${catalogSheetSecondaryBtn} min-h-11 w-full`}>
        Назад
      </button>

      {showMockDemo && onMockDemo ? (
        <div className="border-t border-[#EEEEEE] pt-4">
          <p className="mb-2 text-[12px] text-[#9CA3AF]">Только для разработки</p>
          <button
            type="button"
            onClick={() => void Promise.resolve(onMockDemo())}
            className={`${catalogSheetSecondaryBtn} w-full`}
          >
            Подключить Pro в demo
          </button>
        </div>
      ) : null}
    </div>
  );
}
