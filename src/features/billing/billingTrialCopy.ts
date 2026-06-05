import type { MasterEntitlementsDto } from './api/masterEntitlementsApi';

export function trialDaysLabel(days: number): string {
  const n = Math.abs(days);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} дня`;
  return `${n} дней`;
}

export type BillingPlanDisplay = {
  title: string;
  subtitle: string;
  badge: string;
  tone: 'success' | 'warning' | 'pink' | 'neutral';
  showUpgradeCta: boolean;
};

export function billingPlanDisplayFromEntitlements(
  ent: MasterEntitlementsDto | null,
  uiState: string,
): BillingPlanDisplay {
  if (!ent) {
    return {
      title: 'Бесплатный тариф',
      subtitle: 'Бесплатный тариф с базовыми лимитами',
      badge: 'Бесплатный',
      tone: 'neutral',
      showUpgradeCta: true,
    };
  }

  if (ent.trial.isActive && ent.source === 'trial') {
    const days =
      typeof ent.trial.daysLeft === 'number' ? trialDaysLabel(ent.trial.daysLeft) : '7 дней';
    return {
      title: 'Pro бесплатно',
      subtitle: `Пробный Pro · осталось ${days}. После окончания останетесь на Free — данные сохранятся.`,
      badge: 'Trial Pro',
      tone: 'pink',
      showUpgradeCta: (ent.trial.daysLeft ?? 7) <= 2,
    };
  }

  if (ent.isProEntitled && ent.source === 'paid') {
    return {
      title: 'Master Pro',
      subtitle: 'Подписка Master Pro активна',
      badge: uiState === 'pro_canceled_at_period_end' ? 'До конца периода' : 'Активен',
      tone: uiState === 'past_due' ? 'warning' : 'success',
      showUpgradeCta: false,
    };
  }

  if (ent.isProEntitled && ent.source === 'complimentary') {
    return {
      title: 'Master Pro',
      subtitle: 'Pro доступ предоставлен администратором',
      badge: 'Pro',
      tone: 'success',
      showUpgradeCta: false,
    };
  }

  if (ent.isProEntitled) {
    return {
      title: 'Master Pro',
      subtitle: 'Расширенные возможности активны',
      badge: 'Pro',
      tone: 'success',
      showUpgradeCta: false,
    };
  }

  if (ent.trial.consumed && ent.effectivePlan === 'free') {
    return {
      title: 'Бесплатный тариф',
      subtitle: 'Пробный Pro закончился. Профиль и записи сохранены — подключите Pro для расширенных лимитов.',
      badge: 'Free',
      tone: 'neutral',
      showUpgradeCta: true,
    };
  }

  return {
    title: 'Бесплатный тариф',
    subtitle: 'Бесплатный тариф с базовыми лимитами',
    badge: 'Free',
    tone: 'neutral',
    showUpgradeCta: true,
  };
}
