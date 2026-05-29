import type { ReactNode } from 'react';
import { HiCheck } from 'react-icons/hi2';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';

type CompactPlanCardProps = {
  name: string;
  priceValue: string;
  priceUnit: string;
  features: readonly string[];
  badge?: string;
  active?: boolean;
  variant?: 'free' | 'pro';
  footer: ReactNode;
};

function CompactPlanCard({
  name,
  priceValue,
  priceUnit,
  features,
  badge,
  active,
  variant = 'free',
  footer,
}: CompactPlanCardProps) {
  const isPro = variant === 'pro';

  return (
    <article
      className={`relative flex min-h-0 flex-col rounded-[16px] p-4 ring-1 ${
        isPro
          ? 'bg-[#111827] text-white ring-[#111827]'
          : active
            ? 'bg-white ring-[#111827]/15'
            : 'bg-white ring-[#EEEEEE]'
      }`}
    >
      {badge ? (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
            isPro ? 'bg-white/15 text-white' : 'bg-[#111827] text-white'
          }`}
        >
          {badge}
        </span>
      ) : null}

      <p className={`text-[15px] font-bold tracking-[-0.02em] ${isPro ? 'text-white' : 'text-[#111827]'}`}>
        {name}
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-1">
        <span
          className={`text-[26px] font-bold leading-none tracking-[-0.03em] ${
            isPro ? 'text-white' : 'text-[#111827]'
          }`}
        >
          {priceValue}
        </span>
        {priceUnit ? (
          <span className={`text-[13px] font-medium ${isPro ? 'text-white/70' : 'text-[#6B7280]'}`}>
            {priceUnit}
          </span>
        ) : null}
      </div>

      <ul className="mt-3 flex flex-1 flex-col gap-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <HiCheck
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPro ? 'text-[#F47C8C]' : 'text-[#F47C8C]'}`}
              aria-hidden
            />
            <span className={`text-[12px] leading-snug ${isPro ? 'text-white/85' : 'text-[#374151]'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">{footer}</div>
    </article>
  );
}

export type BillingPlanCardsProps = {
  freePriceValue: string;
  freePriceUnit: string;
  proPriceValue: string;
  proPriceUnit: string;
  freeFeatures: readonly string[];
  proFeatures: readonly string[];
  freeActive: boolean;
  proActive: boolean;
  onSelectFree: () => void;
  onSelectPro: () => void;
};

export function BillingPlanCards({
  freePriceValue,
  freePriceUnit,
  proPriceValue,
  proPriceUnit,
  freeFeatures,
  proFeatures,
  freeActive,
  proActive,
  onSelectFree,
  onSelectPro,
}: BillingPlanCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <CompactPlanCard
        name="Free"
        priceValue={freePriceValue}
        priceUnit={freePriceUnit}
        features={freeFeatures}
        badge={freeActive ? 'Активен' : undefined}
        active={freeActive}
        variant="free"
        footer={
          <button
            type="button"
            disabled={freeActive}
            onClick={onSelectFree}
            className={`${catalogSheetSecondaryBtn} min-h-10 w-full text-[14px] disabled:cursor-default`}
          >
            {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
          </button>
        }
      />
      <CompactPlanCard
        name="Мастер Pro"
        priceValue={proPriceValue}
        priceUnit={proPriceUnit}
        features={proFeatures}
        badge={proActive ? 'Активен' : 'Популярный'}
        variant="pro"
        footer={
          <button
            type="button"
            disabled={proActive}
            onClick={onSelectPro}
            className={`${catalogSheetPrimaryBtn} min-h-10 w-full bg-white text-[14px] text-[#111827] hover:opacity-100 hover:bg-white/95 disabled:cursor-default disabled:bg-white/80 disabled:text-[#6B7280]`}
          >
            {proActive ? 'Текущий тариф' : 'Открыть Pro'}
          </button>
        }
      />
    </div>
  );
}
