import type { ReactNode } from 'react';
import { HiFunnel, HiMagnifyingGlass } from 'react-icons/hi2';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import {
  apptFilterBtnActive,
  apptFilterSegmentBtnClass,
  apptFilterSegmentTrack,
  apptHistoryListCountBadge,
  apptHistorySearchInput,
  apptTrayLabel,
} from './adminAppointmentsTheme';
import type {
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsFeatureFilter,
  RequestsPeriodFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';

type ToolbarBaseProps = {
  search: string;
  onSearch: (value: string) => void;
  filtersActive?: boolean;
  filterOpen?: boolean;
  onOpenFilters?: () => void;
  trailing?: ReactNode;
};

function pluralRu(count: number, one: string, few: string, many: string): string {
  return count === 1 ? one : count < 5 ? few : many;
}

function AppointmentsSearchField({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <label className="relative min-w-0 flex-1">
      <HiMagnifyingGlass
        className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
        aria-hidden
      />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Поиск по клиенту, услуге…"
        className={apptHistorySearchInput}
        aria-label="Поиск по клиенту или услуге"
      />
    </label>
  );
}

function AppointmentsFiltersButton({
  filtersActive,
  filterOpen,
  onOpenFilters,
}: {
  filtersActive: boolean;
  filterOpen: boolean;
  onOpenFilters?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenFilters}
      aria-expanded={filterOpen}
      aria-label={filtersActive ? 'Фильтры активны' : 'Фильтры'}
      className={`relative flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold transition active:scale-[0.98] sm:h-12 sm:px-3.5 sm:text-[14px] ${
        filtersActive ? apptFilterBtnActive : 'bg-[#EBEBEB] text-[#374151]'
      }`}
    >
      <HiFunnel className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" aria-hidden />
      Фильтры
      {filtersActive ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" aria-hidden />
      ) : null}
    </button>
  );
}

function AppointmentsFilterSegments<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={apptFilterSegmentTrack} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={apptFilterSegmentBtnClass(selected)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AppointmentsToolbarShell({
  search,
  onSearch,
  filtersActive = false,
  filterOpen = false,
  onOpenFilters,
  trailing,
  segments,
}: ToolbarBaseProps & { segments?: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <AppointmentsSearchField search={search} onSearch={onSearch} />
        <AppointmentsFiltersButton
          filtersActive={filtersActive}
          filterOpen={filterOpen}
          onOpenFilters={onOpenFilters}
        />
        {trailing}
      </div>
      {segments}
    </section>
  );
}

type ListHeaderProps<T extends string> = {
  title: string;
  count: number;
  countOne: string;
  countFew: string;
  countMany: string;
  sort: T;
  onSort: (value: T) => void;
  sortOptions: Array<{ value: T; label: string }>;
};

function AppointmentsTabListHeader<T extends string>({
  title,
  count,
  countOne,
  countFew,
  countMany,
  sort,
  onSort,
  sortOptions,
}: ListHeaderProps<T>) {
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label ?? sortOptions[0]?.label ?? '';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className={apptTrayLabel}>{title}</h3>
        <span className={apptHistoryListCountBadge}>
          {count} {pluralRu(count, countOne, countFew, countMany)}
        </span>
      </div>

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="text-[13px] font-medium text-[#6B7280]">Сортировка:</span>
        <div className="min-w-[10.5rem]">
          <SlottySelect
            tone="catalog"
            value={sort}
            onChange={(v) => onSort(v as T)}
            options={sortOptions.map((o) => ({
              value: o.value,
              label: `Сортировка: ${o.label}`,
            }))}
            aria-label="Сортировка"
            sheetTitle="Сортировка"
          />
        </div>
        <span className="sr-only">Текущая сортировка: {sortLabel}</span>
      </div>
    </div>
  );
}

const HISTORY_STATUS_OPTIONS: Array<{ value: HistoryStatusFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const HISTORY_PERIOD_OPTIONS: Array<{ value: HistoryPeriodFilter; label: string }> = [
  { value: 'all', label: 'Всё время' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: '3 мес' },
];

const REQUESTS_PERIOD_OPTIONS: Array<{ value: RequestsPeriodFilter; label: string }> = [
  { value: 'all', label: 'Все даты' },
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

const REQUESTS_FEATURE_OPTIONS: Array<{ value: RequestsFeatureFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'expiring', label: 'Срочные' },
  { value: 'with_photo', label: 'С фото' },
];

const HISTORY_SORT_OPTIONS: Array<{ value: HistorySort; label: string }> = [
  { value: 'newest', label: 'По дате' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'price_high', label: 'Дороже' },
  { value: 'price_low', label: 'Дешевле' },
];

const REQUESTS_SORT_OPTIONS: Array<{ value: RequestsSort; label: string }> = [
  { value: 'newest', label: 'Новые' },
  { value: 'oldest', label: 'Старые' },
  { value: 'price_high', label: 'Дороже' },
  { value: 'price_low', label: 'Дешевле' },
];

const UPCOMING_SORT_OPTIONS: Array<{ value: UpcomingSort; label: string }> = [
  { value: 'date', label: 'По дате' },
  { value: 'newest', label: 'Новые' },
];

export function AppointmentsRequestsToolbar({
  search,
  onSearch,
  period,
  onPeriod,
  feature,
  onFeature,
  filtersActive = false,
  filterOpen = false,
  onOpenFilters,
}: ToolbarBaseProps & {
  period: RequestsPeriodFilter;
  onPeriod: (value: RequestsPeriodFilter) => void;
  feature: RequestsFeatureFilter;
  onFeature: (value: RequestsFeatureFilter) => void;
}) {
  return (
    <AppointmentsToolbarShell
      search={search}
      onSearch={onSearch}
      filtersActive={filtersActive}
      filterOpen={filterOpen}
      onOpenFilters={onOpenFilters}
      segments={
        <div className="space-y-1.5">
          <AppointmentsFilterSegments
            options={REQUESTS_PERIOD_OPTIONS}
            value={period}
            onChange={onPeriod}
            ariaLabel="Дата заявки"
          />
          <AppointmentsFilterSegments
            options={REQUESTS_FEATURE_OPTIONS}
            value={feature}
            onChange={onFeature}
            ariaLabel="Особенности заявки"
          />
        </div>
      }
    />
  );
}

export function AppointmentsUpcomingToolbar({
  search,
  onSearch,
  filtersActive = false,
  filterOpen = false,
  onOpenFilters,
  trailing,
}: ToolbarBaseProps) {
  return (
    <AppointmentsToolbarShell
      search={search}
      onSearch={onSearch}
      filtersActive={filtersActive}
      filterOpen={filterOpen}
      onOpenFilters={onOpenFilters}
      trailing={trailing}
    />
  );
}

export function AppointmentsHistoryToolbar({
  search,
  onSearch,
  status,
  onStatus,
  period,
  onPeriod,
  exportMenu,
  filtersActive = false,
  filterOpen = false,
  onOpenFilters,
}: ToolbarBaseProps & {
  status: HistoryStatusFilter;
  onStatus: (value: HistoryStatusFilter) => void;
  period: HistoryPeriodFilter;
  onPeriod: (value: HistoryPeriodFilter) => void;
  exportMenu: ReactNode;
}) {
  return (
    <AppointmentsToolbarShell
      search={search}
      onSearch={onSearch}
      filtersActive={filtersActive}
      filterOpen={filterOpen}
      onOpenFilters={onOpenFilters}
      trailing={exportMenu}
      segments={
        <div className="space-y-1.5">
          <AppointmentsFilterSegments
            options={HISTORY_STATUS_OPTIONS}
            value={status}
            onChange={onStatus}
            ariaLabel="Статус записи"
          />
          <AppointmentsFilterSegments
            options={HISTORY_PERIOD_OPTIONS}
            value={period}
            onChange={onPeriod}
            ariaLabel="Период"
          />
        </div>
      }
    />
  );
}

export function AppointmentsRequestsListHeader({
  count,
  sort,
  onSort,
}: {
  count: number;
  sort: RequestsSort;
  onSort: (value: RequestsSort) => void;
}) {
  return (
    <AppointmentsTabListHeader
      title="Заявки"
      count={count}
      countOne="заявка"
      countFew="заявки"
      countMany="заявок"
      sort={sort}
      onSort={onSort}
      sortOptions={REQUESTS_SORT_OPTIONS}
    />
  );
}

export function AppointmentsUpcomingListHeader({
  count,
  sort,
  onSort,
}: {
  count: number;
  sort: UpcomingSort;
  onSort: (value: UpcomingSort) => void;
}) {
  return (
    <AppointmentsTabListHeader
      title="Предстоящие записи"
      count={count}
      countOne="запись"
      countFew="записи"
      countMany="записей"
      sort={sort}
      onSort={onSort}
      sortOptions={UPCOMING_SORT_OPTIONS}
    />
  );
}

export function AppointmentsHistoryListHeader({
  count,
  sort,
  onSort,
}: {
  count: number;
  sort: HistorySort;
  onSort: (value: HistorySort) => void;
}) {
  return (
    <AppointmentsTabListHeader
      title="История записей"
      count={count}
      countOne="запись"
      countFew="записи"
      countMany="записей"
      sort={sort}
      onSort={onSort}
      sortOptions={HISTORY_SORT_OPTIONS}
    />
  );
}
