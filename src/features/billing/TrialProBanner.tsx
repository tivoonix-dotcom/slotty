import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_BILLING_PATH } from '../../app/paths';
import type { MasterEntitlementsDto } from './api/masterEntitlementsApi';
import { trialDaysLabel } from './billingTrialCopy';

type Props = {
  entitlements: MasterEntitlementsDto | null;
  className?: string;
};

export function TrialProBanner({ entitlements, className = '' }: Props) {
  if (!entitlements) return null;

  const { trial, isProEntitled, effectivePlan } = entitlements;

  if (trial.isActive && typeof trial.daysLeft === 'number') {
    const urgent = trial.daysLeft <= 2;
    return (
      <div
        className={`rounded-2xl border px-4 py-3 text-sm leading-snug ${
          urgent
            ? 'border-[#E29595]/40 bg-[#FFF5F5] text-[#7F1D1D]'
            : 'border-[#E29595]/25 bg-[#FFF8F8] text-[#374151]'
        } ${className}`}
        role="status"
      >
        <p className="font-semibold text-[#111827]">
          Pro бесплатно · осталось {trialDaysLabel(trial.daysLeft)}
        </p>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Больше услуг и окон, мягкое продвижение в каталоге и расширенная аналитика.
        </p>
        {urgent ? (
          <Link
            to={ADMIN_BILLING_PATH}
            className="mt-2 inline-flex min-h-9 items-center rounded-full bg-[#E29595] px-4 text-[13px] font-semibold text-white transition active:scale-[0.98]"
          >
            Продлить Pro
          </Link>
        ) : null}
      </div>
    );
  }

  if (trial.consumed && !isProEntitled && effectivePlan === 'free') {
    return (
      <div
        className={`rounded-2xl border border-neutral-200/80 bg-[#FAFAFA] px-4 py-3 text-sm leading-snug text-[#374151] ${className}`}
        role="status"
      >
        <p className="font-semibold text-[#111827]">Пробный Pro закончился</p>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Вы остались на Free — профиль, услуги и записи сохранены. Расширенная аналитика, акции и
          горизонт 90 дней доступны на Pro.
        </p>
        <Link
          to={ADMIN_BILLING_PATH}
          className="mt-2 inline-flex min-h-9 items-center rounded-full border border-[#E29595]/50 px-4 text-[13px] font-semibold text-[#B45353] transition active:scale-[0.98]"
        >
          Подключить Pro
        </Link>
      </div>
    );
  }

  return null;
}

export function TrialProBannerSlot({
  entitlements,
  children,
}: {
  entitlements: MasterEntitlementsDto | null;
  children?: ReactNode;
}) {
  return (
    <>
      <TrialProBanner entitlements={entitlements} className="mb-3" />
      {children}
    </>
  );
}
