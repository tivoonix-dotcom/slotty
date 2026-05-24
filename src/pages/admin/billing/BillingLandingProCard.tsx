import { MasterProRotatingCard } from '../../home/MasterProRotatingCard';
import { homeOutlineBtn } from './adminBillingLandingTheme';

type Props = {
  priceValue: string;
  priceUnit: string;
  includes: string[];
  active: boolean;
  onSelect: () => void;
};

export function BillingLandingProCard({ priceValue, priceUnit, includes, active, onSelect }: Props) {
  const ctaLabel = active ? 'Текущий тариф' : 'Открыть Pro';

  return (
    <MasterProRotatingCard
      priceValue={priceValue}
      priceUnit={priceUnit}
      description="Для активной работы: безлимит записей, расширенная сводка и полный кабинет."
      features={includes.slice(0, 6)}
      topBadge={active ? 'Активен' : 'Рекомендуем'}
      cta={
        <button
          type="button"
          onClick={() => {
            if (!active) onSelect();
          }}
          disabled={active}
          className={`flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98] ${
            active
              ? `${homeOutlineBtn} cursor-default !bg-white/20 !text-white`
              : 'bg-white text-[#111827] shadow-[0_10px_28px_rgba(0,0,0,0.12)]'
          }`}
        >
          {ctaLabel}
        </button>
      }
    />
  );
}
