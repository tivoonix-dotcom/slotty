import { billingCheckIcon, billingLandingCard, homeOutlineBtn, homePinkBtn } from './adminBillingLandingTheme';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  name: string;
  priceLine: string;
  tagline: string;
  includes: string[];
  limits: string[];
  active: boolean;
  onSelect: () => void;
};

export function BillingLandingFreeCard({
  name,
  priceLine,
  tagline,
  includes,
  limits,
  active,
  onSelect,
}: Props) {
  const ctaLabel = active ? 'Текущий тариф' : 'Перейти на Free';

  return (
    <article
      className={`relative flex min-h-[20rem] flex-col overflow-hidden px-5 pb-6 pt-5 text-[#111827] ${billingLandingCard} ${
        active ? 'ring-2 ring-[#F47C8C]/35' : ''
      }`}
    >
      {active ? (
        <span className="absolute right-4 top-4 rounded-full bg-[#F47C8C] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          Активен
        </span>
      ) : null}

      <p className="text-[18px] font-semibold tracking-tight">{name}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-[36px] font-bold tracking-tight">{priceLine.split(' / ')[0] ?? priceLine}</span>
        {priceLine.includes(' / ') ? (
          <span className="text-[14px] font-medium text-[#6B7280]">/ {priceLine.split(' / ')[1]}</span>
        ) : null}
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">{tagline}</p>

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {includes.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5">
            <span className={billingCheckIcon}>
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-medium text-[#374151]">{feature}</span>
          </li>
        ))}
      </ul>

      {limits.length > 0 ? (
        <div className="mt-4 rounded-[18px] bg-[#F9FAFB] px-4 py-3 ring-1 ring-[#F3F4F6]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">Ограничения</p>
          <ul className="mt-2 space-y-1 text-[13px] text-[#6B7280]">
            {limits.map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!active) onSelect();
        }}
        disabled={active}
        className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98] ${
          active ? `${homeOutlineBtn} cursor-default opacity-80` : homePinkBtn
        }`}
      >
        {ctaLabel}
      </button>
    </article>
  );
}
