import { Link } from 'react-router-dom';
import { HiArrowRight, HiCreditCard, HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import type { MasterSubscriptionDto } from '../../../features/admin/api/adminBillingApi';
import { useMasterEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { formatBillingDateShort } from '../billing/billingFormat';
import { CrmStatusBadge } from '../shared/adminCrmUi';
import { overviewDesktopCard, overviewDesktopCardPad } from './adminOverviewTheme';

function subscriptionTone(
  subscription: MasterSubscriptionDto | null,
  isProEntitled: boolean,
  trialActive: boolean,
): 'success' | 'warning' | 'pink' | 'neutral' | 'danger' {
  if (!subscription) return 'neutral';
  if (subscription.status === 'past_due') return 'danger';
  if (trialActive) return 'pink';
  if (isProEntitled) return 'success';
  if (subscription.status === 'canceled') return 'warning';
  return 'neutral';
}

function subscriptionLabel(
  subscription: MasterSubscriptionDto | null,
  isProEntitled: boolean,
  trialActive: boolean,
): string {
  if (!subscription) return 'Загрузка…';
  if (trialActive) return 'Пробный Pro';
  if (subscription.status === 'past_due') return 'Нужна оплата';
  if (isProEntitled) return 'Pro активен';
  return 'Бесплатный';
}

type Props = {
  subscription: MasterSubscriptionDto | null;
  loading?: boolean;
};

export function OverviewSubscriptionStatusCard({ subscription, loading }: Props) {
  const { entitlements } = useMasterEntitlements();
  const isProEntitled = Boolean(entitlements?.isProEntitled);
  const trialActive = Boolean(entitlements?.trial?.isActive);
  const planCode = subscription?.plan.code?.toLowerCase() ?? 'free';
  const periodEnd = subscription?.currentPeriodEnd
    ? formatBillingDateShort(subscription.currentPeriodEnd)
    : null;

  if (loading && !subscription) {
    return (
      <div className={`${overviewDesktopCard} ${overviewDesktopCardPad} animate-pulse`}>
        <div className="h-16 rounded-[12px] bg-[#F3F4F6]" />
      </div>
    );
  }

  const tone = subscriptionTone(subscription, isProEntitled, trialActive);
  const label = subscriptionLabel(subscription, isProEntitled, trialActive);
  const showUpgrade = !isProEntitled && !trialActive;

  return (
    <Link
      to={ADMIN_BILLING_PATH}
      className={`group block no-underline transition active:scale-[0.99] ${overviewDesktopCard} ${overviewDesktopCardPad}`}
      aria-label="Открыть раздел тарифов и подписки"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#ff5f7a]">
          {isProEntitled || trialActive ? (
            <HiSparkles className="h-5 w-5" aria-hidden />
          ) : (
            <HiCreditCard className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-bold text-[#111827]">Подписка</p>
            <CrmStatusBadge tone={tone}>{label}</CrmStatusBadge>
          </div>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7280]">
            {trialActive && typeof entitlements?.trial?.daysLeft === 'number'
              ? `Пробный период · осталось ${entitlements.trial.daysLeft} дн.`
              : isProEntitled && periodEnd
                ? `Тариф ${planCode === 'pro' ? 'Pro' : subscription?.plan.name ?? 'Pro'} · до ${periodEnd}`
                : showUpgrade
                  ? 'Подключите Pro для аналитики, акций и расширенного расписания'
                  : 'Управление тарифом и способом оплаты'}
          </p>
        </div>
        <HiArrowRight
          className="mt-1 h-5 w-5 shrink-0 text-[#9CA3AF] transition group-hover:translate-x-0.5 group-hover:text-[#ff5f7a]"
          aria-hidden
        />
      </div>
    </Link>
  );
}
