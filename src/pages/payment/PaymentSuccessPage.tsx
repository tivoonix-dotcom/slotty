import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ADMIN_BILLING_PATH, ADMIN_PATH, MASTER_SETTINGS_BILLING_PATH } from '../../app/paths';
import {
  getBillingSubscription,
  getPaymentStatus,
} from '../../features/billing/api/masterBillingApi';
import { BILLING_COPY, paymentReturnPath } from '../../features/billing/billingCopy';
import { LoadingVideo } from '../../shared/ui/LoadingVideo';
import { PaymentResultLayout } from './PaymentResultLayout';

type PollState = 'polling' | 'success' | 'failed' | 'timeout';

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 12;

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get('payment_id') ?? params.get('paymentId');
  const from = params.get('from');
  const returnPath = paymentReturnPath(from);
  const fromOnboarding = from === 'onboarding';

  const [pollState, setPollState] = useState<PollState>(paymentId ? 'polling' : 'timeout');
  const [proConfirmed, setProConfirmed] = useState(false);
  const [pollTick, setPollTick] = useState(0);

  const layoutTone = useMemo(() => {
    if (pollState === 'success') return 'success' as const;
    if (pollState === 'failed') return 'fail' as const;
    return 'pending' as const;
  }, [pollState]);

  const title = useMemo(() => {
    if (pollState === 'success') return BILLING_COPY.paymentConfirmed;
    if (pollState === 'failed') return 'Оплата не подтверждена';
    if (pollState === 'timeout') return 'Оплата обрабатывается';
    return BILLING_COPY.paymentProcessing;
  }, [pollState]);

  const poll = useCallback(async () => {
    if (!paymentId) return 'timeout' as PollState;
    try {
      const payment = await getPaymentStatus(paymentId);
      if (payment.status === 'success') return 'success';
      if (payment.status === 'failed' || payment.status === 'expired' || payment.status === 'cancelled') {
        return 'failed';
      }
    } catch {
      /* keep polling */
    }
    try {
      const billing = await getBillingSubscription();
      if (billing.isProEntitled && billing.lastPayment?.paymentId === paymentId) {
        return 'success';
      }
      if (paymentId && billing.lastPayment?.paymentId === paymentId && billing.lastPayment.status === 'paid') {
        return 'success';
      }
    } catch {
      /* keep polling */
    }
    return 'polling';
  }, [paymentId]);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      const state = await poll();
      if (cancelled) return;
      if (state === 'success') {
        setPollState('success');
        setProConfirmed(true);
        return;
      }
      if (state === 'failed') {
        setPollState('failed');
        return;
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPollState('timeout');
        return;
      }
      window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [paymentId, poll, pollTick]);

  useEffect(() => {
    if (pollState !== 'success') return;
    const t = window.setTimeout(() => navigate(returnPath, { replace: true }), 4000);
    return () => window.clearTimeout(t);
  }, [pollState, navigate, returnPath]);

  const handleCheckAgain = () => {
    setPollState('polling');
    setProConfirmed(false);
    setPollTick((n) => n + 1);
  };

  return (
    <PaymentResultLayout title={title} tone={layoutTone}>
      {pollState === 'polling' ? (
        <div className="flex justify-center py-4">
          <LoadingVideo size="sm" label={BILLING_COPY.paymentProcessing} />
        </div>
      ) : null}

      {pollState === 'polling' ? (
        <p className="text-[14px] text-neutral-600">{BILLING_COPY.paymentPendingWebhook}</p>
      ) : null}

      {pollState === 'timeout' ? (
        <p className="text-[14px] text-neutral-600">{BILLING_COPY.paymentStillProcessing}</p>
      ) : null}

      {pollState === 'success' && proConfirmed ? (
        <>
          <p className="text-[14px] text-neutral-600">
            {fromOnboarding
              ? BILLING_COPY.paymentSuccessOnboardingLead
              : 'Подписка обновлена. Через несколько секунд вы будете перенаправлены в кабинет.'}
          </p>
          {fromOnboarding ? (
            <p className="mt-2 text-[14px] text-neutral-600">{BILLING_COPY.paymentSuccessOnboardingServices}</p>
          ) : null}
        </>
      ) : null}

      {pollState === 'failed' ? (
        <p className="text-[14px] text-neutral-600">
          Платёж не был подтверждён. Попробуйте снова из раздела тарифов.
        </p>
      ) : null}

      {paymentId ? (
        <p className="text-[12px] text-neutral-400">
          Номер платежа: <span className="font-mono">{paymentId}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {pollState === 'timeout' || pollState === 'polling' ? (
          <button
            type="button"
            onClick={handleCheckAgain}
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white"
          >
            {BILLING_COPY.checkAgain}
          </button>
        ) : null}
        <Link
          to={fromOnboarding ? ADMIN_PATH : returnPath}
          className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white"
        >
          {fromOnboarding ? BILLING_COPY.paymentSuccessOnboardingCabinet : BILLING_COPY.backToBilling}
        </Link>
        <Link
          to={from === 'settings' ? MASTER_SETTINGS_BILLING_PATH : ADMIN_BILLING_PATH}
          className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-neutral-200 px-5 text-[14px] font-semibold text-neutral-700"
        >
          {BILLING_COPY.backToPayment}
        </Link>
      </div>
    </PaymentResultLayout>
  );
}
