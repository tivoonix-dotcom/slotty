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
  catalogFilterChipActive,
  catalogFilterChipIdle,
  catalogFilterSectionIconClass,
  catalogFilterSectionTitleClass,
} from './servicesCatalogTheme';

export function FilterSection({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  collapsible = true,
}: {
  icon: IconType;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className="min-w-0">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className={catalogFilterSectionIconClass}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h3 className={catalogFilterSectionTitleClass}>{title}</h3>
        </div>
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
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={catalogFilterSectionIconClass}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h3 className={catalogFilterSectionTitleClass}>{title}</h3>
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
  icon: Icon,
  label,
  onClick,
  className = '',
}: {
  active: boolean;
  icon?: IconType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] transition ${className} ${
        active ? catalogFilterChipActive : catalogFilterChipIdle
      }`}
    >
      {Icon ? (
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[#F47C8C]' : 'text-[#6B7280]'}`}
          aria-hidden
        />
      ) : null}
      <span className={active ? 'font-semibold' : 'font-medium'}>{label}</span>
    </button>
  );
}

export function FilterSwitch({
  active,
  label,
  onChange,
}: {
  active: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] bg-[#FAFAFA] px-3.5 py-3">
      <span className="text-[13px] font-semibold text-[#111827]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => onChange(!active)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-[#F47C8C]' : 'bg-[#E5E7EB]'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${active ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
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
