import type { FC } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LEGAL_PAYMENT_PATH } from '../../app/paths';
import {
  BILLING_COPY,
  onboardingPaymentFreePath,
  onboardingPaymentRetryPath,
  onboardingPaymentTariffPath,
  paymentReturnPath,
} from '../../features/billing/billingCopy';
import { ONBOARDING_PLAN_COPY } from '../master-onboarding/onboardingPlanCopy';
import { SITE_SUPPORT_EMAIL } from '../legal/legalSiteInfo';
import { PaymentResultLayout } from './PaymentResultLayout';

export const PaymentFailPage: FC = () => {
  const [params] = useSearchParams();
  const from = params.get('from');
  const returnPath = paymentReturnPath(from);
  const fromOnboarding = from === 'onboarding';

  return (
    <PaymentResultLayout title="Оплата не завершена" tone="fail">
      <p>
        {fromOnboarding
          ? ONBOARDING_PLAN_COPY.paymentFailedOnboarding
          : 'Платёж не был завершён или был отклонён банком / платёжной системой.'}
      </p>
      {!fromOnboarding ? (
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-neutral-600">
          <li>недостаточно средств или лимит карты;</li>
          <li>отмена на странице оплаты;</li>
          <li>ошибка 3-D Secure;</li>
          <li>временная недоступность провайдера.</li>
        </ul>
      ) : (
        <p className="text-[13px] leading-relaxed text-neutral-600">
          Услуги и черновик профиля сохранены. Pro не активирован — для него нужна успешная оплата.
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {fromOnboarding ? (
          <>
            <Link
              to={onboardingPaymentRetryPath()}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white"
            >
              {ONBOARDING_PLAN_COPY.paymentFailedRetry}
            </Link>
            <Link
              to={onboardingPaymentTariffPath()}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F1EFEF] px-5 text-[14px] font-semibold text-neutral-800"
            >
              {ONBOARDING_PLAN_COPY.paymentFailedBackTariff}
            </Link>
            <Link
              to={onboardingPaymentFreePath()}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-neutral-800"
            >
              {ONBOARDING_PLAN_COPY.paymentFailedStayFree}
            </Link>
          </>
        ) : (
          <Link
            to={returnPath}
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white"
          >
            {BILLING_COPY.backToPayment}
          </Link>
        )}
      </div>
      <p className="mt-4 text-[13px] text-neutral-500">
        Подробнее —{' '}
        <Link to={LEGAL_PAYMENT_PATH} className="font-semibold text-[#E29595] hover:underline">
          оплата и безопасность
        </Link>
        .
      </p>
      <p className="text-[13px]">
        Поддержка:{' '}
        <a className="font-semibold text-[#E29595] hover:underline" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
          {SITE_SUPPORT_EMAIL}
        </a>
      </p>
    </PaymentResultLayout>
  );
};
