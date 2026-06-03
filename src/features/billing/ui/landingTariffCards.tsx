import type { ReactNode } from 'react';
import { MasterProRotatingCard } from '../../../pages/home/MasterProRotatingCard';

/** Как на главной в секции «Тарифы». */
export const LANDING_MASTER_PRO_FEATURES = [
  'Ваш регион в каталоге SLOTTY',
  'Безлимит услуг и записей',
  'График на 90 дней',
  'Расширенная сводка и аналитика',
  'Приоритет в поиске',
  'Акции и наборы услуг',
  'Telegram-уведомления клиентам',
] as const;

export const LANDING_MASTER_FREE_FEATURES = [
  'Ваш регион в каталоге SLOTTY',
  'Профиль мастера в каталоге',
  'До 3 услуг',
  'До 20 записей в месяц',
  'График на 14 дней',
  'Заявки и управление записями',
] as const;

export const LANDING_PRO_DESCRIPTION =
  'Для мастеров, которые хотят принимать записи онлайн и управлять услугами в одном кабинете.';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type LandingPricingCardProps = {
  name: string;
  priceValue: string;
  priceUnit: string;
  includesLabel?: string;
  features: readonly string[];
  badge?: string;
  highlighted?: boolean;
  description?: string;
  footer: ReactNode;
};

/** Белая карточка тарифа — тот же блок, что «Мастер» / «Клиент» на лендинге. */
export function LandingPricingCard({
  name,
  priceValue,
  priceUnit,
  includesLabel = 'Включено:',
  features,
  badge,
  highlighted = false,
  description,
  footer,
}: LandingPricingCardProps) {
  return (
    <article
      className={`relative flex min-h-full flex-col rounded-[20px] border bg-white p-6 sm:p-7 ${
        highlighted
          ? 'z-10 border-[#111827] shadow-[0_24px_60px_rgba(17,24,39,0.12)]'
          : 'border-[#E8EAED] shadow-[0_8px_30px_rgba(17,24,39,0.04)]'
      }`}
    >
      {badge ? (
        <span className="absolute right-5 top-5 rounded-full bg-[#111827] px-3 py-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      ) : null}

      <p className="text-[17px] font-semibold tracking-tight text-[#111827]">{name}</p>

      {description ? (
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="text-[40px] font-bold leading-none tracking-[-0.04em] text-[#111827] sm:text-[44px]">
          {priceValue}
        </span>
        {priceUnit ? <span className="text-[15px] font-medium text-[#6B7280]">{priceUnit}</span> : null}
      </div>

      <p className="mt-6 text-[13px] font-medium text-[#9CA3AF]">{includesLabel}</p>

      <ul className="mt-3 flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#111827]" />
            <span className="text-[14px] leading-snug text-[#374151]">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">{footer}</div>
    </article>
  );
}

export type LandingProTariffCardProps = {
  priceValue: string;
  priceUnit: string;
  features?: readonly string[];
  description?: string;
  topBadge?: string;
  footer: ReactNode;
  denseCta?: boolean;
};

/** Pro — тот же `MasterProRotatingCard`, что на лендинге. */
export function LandingProTariffCard({
  priceValue,
  priceUnit,
  features = LANDING_MASTER_PRO_FEATURES,
  description = LANDING_PRO_DESCRIPTION,
  topBadge = 'Популярный',
  footer,
  denseCta = false,
}: LandingProTariffCardProps) {
  return (
    <MasterProRotatingCard
      priceValue={priceValue}
      priceUnit={priceUnit}
      description={description}
      features={features}
      topBadge={topBadge}
      cta={footer}
      denseCta={denseCta}
    />
  );
}

/** Кнопки в стиле лендинга (серая / тёмная). */
export function landingPlanCtaClass(highlighted: boolean, disabled = false): string {
  const base =
    'flex min-h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition active:scale-[0.98]';
  if (disabled) {
    return `${base} cursor-default bg-[#F3F4F6] text-[#6B7280] opacity-80`;
  }
  if (highlighted) {
    return `${base} bg-[#111827] text-white hover:bg-[#2d2d2d]`;
  }
  return `${base} bg-[#F3F4F6] text-[#111827] hover:bg-[#ECEEF1]`;
}

/** CTA на карточке Pro (белая pill). */
export function landingProCtaClass(disabled = false): string {
  return `flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98] ${
    disabled
      ? 'cursor-default bg-white/90 text-[#6B7280] shadow-none'
      : 'bg-white text-[#111827] shadow-[0_10px_28px_rgba(0,0,0,0.12)] hover:bg-white/95'
  }`;
}
