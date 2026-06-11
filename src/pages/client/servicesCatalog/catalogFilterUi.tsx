import { useState, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { HiChevronDown } from 'react-icons/hi2';
import {
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiBanknotes,
  HiBolt,
  HiBuildingStorefront,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiClock,
  HiCloud,
  HiHomeModern,
  HiMoon,
  HiSparkles,
  HiStar,
  HiSun,
} from 'react-icons/hi2';
import type { CatalogSortBy } from './catalogFiltersState';
import {
  catalogFilterPromoBg,
  catalogFilterSheetChipClass,
  catalogFilterSheetPromoBarClass,
  catalogFilterSheetSectionTitleClass,
  catalogFilterSheetToggleRow,
} from './catalogFilterSheetTheme';
import {
  catalogFilterChipActive,
  catalogFilterChipIdle,
  catalogFilterSectionTitleClass,
} from './servicesCatalogTheme';

export type CatalogFilterUiVariant = 'default' | 'sheet';

export function FilterSection({
  title,
  children,
  defaultOpen = false,
  collapsible = true,
  variant = 'default',
  activeHint,
}: {
  /** @deprecated Иконки секций отключены — prop оставлен для совместимости вызовов. */
  icon?: IconType;
  /** @deprecated */
  leading?: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  variant?: CatalogFilterUiVariant;
  /** Короткая подсказка выбранного значения, когда секция свёрнута */
  activeHint?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    const titleClass =
      variant === 'sheet' ? catalogFilterSheetSectionTitleClass : `${catalogFilterSectionTitleClass} mb-2.5`;

    return (
      <section className="min-w-0">
        <h3 className={titleClass}>{title}</h3>
        <div className="min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <section className="min-w-0 border-b border-[#F0F0F0] pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2.5 flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className={`${catalogFilterSectionTitleClass} shrink-0`}>{title}</h3>
          {!open && activeHint ? (
            <span className="min-w-0 truncate text-[12px] font-medium text-[#F47C8C]">{activeHint}</span>
          ) : null}
        </span>
        <HiChevronDown
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? <div className="min-w-0">{children}</div> : null}
    </section>
  );
}

export function FilterChip({
  active,
  icon: _Icon,
  label,
  onClick,
  className = '',
  variant = 'default',
}: {
  active: boolean;
  icon?: IconType;
  label: string;
  onClick: () => void;
  className?: string;
  variant?: CatalogFilterUiVariant;
}) {
  if (variant === 'sheet') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${catalogFilterSheetChipClass(active)} ${className}`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[10px] px-3 py-2 text-[13px] transition ${className} ${
        active ? catalogFilterChipActive : catalogFilterChipIdle
      } ${active ? 'font-semibold' : 'font-medium'}`}
    >
      {label}
    </button>
  );
}

function FilterToggle({
  active,
  onChange,
  accent = 'brand',
}: {
  active: boolean;
  onChange: (next: boolean) => void;
  accent?: 'brand' | 'white';
}) {
  const trackClass =
    accent === 'white'
      ? active
        ? 'bg-white'
        : 'bg-white/40'
      : active
        ? 'bg-[#F47C8C]'
        : 'bg-[#D1D5DB]';

  const knobClass =
    accent === 'white' && active
      ? 'bg-[#F47C8C] shadow-[0_1px_4px_rgba(17,24,39,0.18)]'
      : 'bg-white shadow-[0_1px_4px_rgba(17,24,39,0.12)]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${trackClass}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full transition ${knobClass} ${
          active ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function FilterPromoBar({
  active,
  label,
  onChange,
}: {
  active: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={catalogFilterSheetPromoBarClass}>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${catalogFilterPromoBg})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#111827]/20" aria-hidden />
      <span className="relative z-10 text-[13px] font-bold uppercase tracking-wide text-white">
        {label}
      </span>
      <span className="relative z-10">
        <FilterToggle active={active} onChange={onChange} accent="white" />
      </span>
    </label>
  );
}

export function FilterSwitch({
  active,
  label,
  onChange,
  variant = 'default',
}: {
  active: boolean;
  label: string;
  onChange: (next: boolean) => void;
  variant?: CatalogFilterUiVariant;
}) {
  const rowClass =
    variant === 'sheet'
      ? catalogFilterSheetToggleRow
      : 'flex cursor-pointer items-center justify-between gap-3 rounded-[10px] bg-[#FAFAFA] px-3.5 py-3';

  return (
    <label className={rowClass}>
      <span
        className={
          variant === 'sheet'
            ? 'text-[15px] font-medium text-[#111827]'
            : 'text-[13px] font-semibold text-[#111827]'
        }
      >
        {label}
      </span>
      <FilterToggle active={active} onChange={onChange} />
    </label>
  );
}

export const DATE_FILTER_OPTIONS = [
  { value: 'any', label: 'Все', icon: HiCalendarDays },
  { value: 'today', label: 'Сегодня', icon: HiBolt },
  { value: 'tomorrow', label: 'Завтра', icon: HiSun },
  { value: 'week', label: 'Неделя', icon: HiCalendarDays },
  { value: 'weekend', label: 'Выходные', icon: HiSparkles },
] as const;

export const TIME_FILTER_OPTIONS = [
  { value: 'any', label: 'Все', icon: HiClock },
  { value: 'morning', label: 'Утро', icon: HiSun },
  { value: 'afternoon', label: 'День', icon: HiCloud },
  { value: 'evening', label: 'Вечер', icon: HiMoon },
] as const;

export const PRICE_FILTER_OPTIONS = [
  { value: 'any', label: 'Все' },
  { value: 'under30', label: '≤30' },
  { value: '30_50', label: '30–50' },
  { value: '50_100', label: '50–100' },
  { value: 'over100', label: '100+' },
] as const;

/** Подписи цены в мобильном sheet — как у каталога мастеров. */
export const SHEET_PRICE_FILTER_OPTIONS = [
  { value: 'any', label: 'Любая' },
  { value: 'under30', label: 'до 30 BYN' },
  { value: '30_50', label: '30–50 BYN' },
  { value: '50_100', label: '50–100 BYN' },
  { value: 'over100', label: 'от 100 BYN' },
] as const;

/** Подписи рейтинга в мобильном sheet — как у каталога мастеров. */
export const SHEET_RATING_FILTER_OPTIONS = [
  { value: null, label: 'Любой' },
  { value: 4.5, label: 'от 4.5' },
  { value: 4.7, label: 'от 4.7' },
  { value: 4.9, label: 'от 4.9' },
] as const;

export const SHEET_VISIT_FILTER_OPTIONS = [
  { value: 'any', label: 'Любой' },
  { value: 'studio', label: 'В салоне' },
  { value: 'at_home', label: 'На дому' },
] as const;

export const SHEET_DURATION_FILTER_OPTIONS = [
  { value: 'any', label: 'Любая' },
  { value: 'under30', label: 'До 30 мин' },
  { value: '30_60', label: '30–60 мин' },
  { value: '60_120', label: '1–2 ч' },
  { value: 'over120', label: 'От 2 ч' },
] as const;

export const VISIT_FILTER_OPTIONS = [
  { value: 'any', label: 'Все', icon: HiSparkles },
  { value: 'studio', label: 'Салон', icon: HiBuildingStorefront },
  { value: 'at_home', label: 'Дом', icon: HiHomeModern },
] as const;

export const DURATION_FILTER_OPTIONS = [
  { value: 'any', label: 'Все', icon: HiClock },
  { value: 'under30', label: '<30м', icon: HiClock },
  { value: '30_60', label: '30–60м', icon: HiClock },
  { value: '60_120', label: '1–2ч', icon: HiClock },
  { value: 'over120', label: '2ч+', icon: HiClock },
] as const;

export const RATING_FILTER_OPTIONS = [
  { value: null, label: 'Все', icon: HiStar },
  { value: 4.5, label: '4.5+', icon: HiStar },
  { value: 4.7, label: '4.7+', icon: HiStar },
  { value: 4.9, label: '4.9+', icon: HiStar },
] as const;

export const SORT_FILTER_OPTIONS: Array<{
  value: CatalogSortBy;
  label: string;
  icon: IconType;
}> = [
  { value: 'recommended', label: 'Топ', icon: HiSparkles },
  { value: 'soonest', label: 'Скорее', icon: HiBolt },
  { value: 'rating', label: 'Рейтинг', icon: HiStar },
  { value: 'price_asc', label: 'Дешевле', icon: HiArrowTrendingDown },
  { value: 'price_desc', label: 'Дороже', icon: HiArrowTrendingUp },
  { value: 'reviews', label: 'Отзывы', icon: HiChatBubbleLeftRight },
];

export { HiBanknotes };
