import { HiFunnel } from 'react-icons/hi2';
import {
  apptChip,
  apptChipActive,
  apptChipIdle,
  apptFilterBtnActive,
  apptFilterBtnIdle,
} from './adminAppointmentsTheme';
import type {
  AppointmentsTabId,
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';

type Chip = {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

type Props = {
  tab: AppointmentsTabId;
  sheetActive: boolean;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  sheetAriaLabel: string;
  requestsSort: RequestsSort;
  onRequestsSort: (sort: RequestsSort) => void;
  upcomingSort: UpcomingSort;
  onUpcomingSort: (sort: UpcomingSort) => void;
  historySort: HistorySort;
  onHistorySort: (sort: HistorySort) => void;
  historyStatus: HistoryStatusFilter;
  onHistoryStatus: (status: HistoryStatusFilter) => void;
  historyPeriod: HistoryPeriodFilter;
  onHistoryPeriod: (period: HistoryPeriodFilter) => void;
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${apptChip} whitespace-nowrap ${active ? apptChipActive : apptChipIdle}`}
    >
      {label}
    </button>
  );
}

export function AppointmentsQuickFilters({
  tab,
  sheetActive,
  sheetOpen,
  onOpenSheet,
  sheetAriaLabel,
  requestsSort,
  onRequestsSort,
  upcomingSort,
  onUpcomingSort,
  historySort,
  onHistorySort,
  historyStatus,
  onHistoryStatus,
  historyPeriod,
  onHistoryPeriod,
}: Props) {
  let chips: Chip[] = [];

  if (tab === 'requests') {
    chips = [
      {
        id: 'newest',
        label: 'Сначала новые',
        active: requestsSort === 'newest',
        onClick: () => onRequestsSort('newest'),
      },
      {
        id: 'oldest',
        label: 'Сначала старые',
        active: requestsSort === 'oldest',
        onClick: () => onRequestsSort('oldest'),
      },
    ];
  } else if (tab === 'upcoming') {
    chips = [
      {
        id: 'date',
        label: 'По дате',
        active: upcomingSort === 'date',
        onClick: () => onUpcomingSort('date'),
      },
      {
        id: 'newest',
        label: 'Сначала новые',
        active: upcomingSort === 'newest',
        onClick: () => onUpcomingSort('newest'),
      },
    ];
  } else {
    chips = [
      {
        id: 'sort-newest',
        label: 'Сначала новые',
        active: historySort === 'newest',
        onClick: () => onHistorySort('newest'),
      },
      {
        id: 'sort-oldest',
        label: 'Сначала старые',
        active: historySort === 'oldest',
        onClick: () => onHistorySort('oldest'),
      },
      {
        id: 'sort-price',
        label: 'Дороже',
        active: historySort === 'price_high',
        onClick: () => onHistorySort('price_high'),
      },
      {
        id: 'status-completed',
        label: 'Завершено',
        active: historyStatus === 'completed',
        onClick: () => onHistoryStatus(historyStatus === 'completed' ? 'all' : 'completed'),
      },
      {
        id: 'status-cancelled',
        label: 'Отменено',
        active: historyStatus === 'cancelled',
        onClick: () => onHistoryStatus(historyStatus === 'cancelled' ? 'all' : 'cancelled'),
      },
      {
        id: 'period-month',
        label: 'Месяц',
        active: historyPeriod === 'month',
        onClick: () => onHistoryPeriod(historyPeriod === 'month' ? 'all' : 'month'),
      },
      {
        id: 'period-quarter',
        label: '3 месяца',
        active: historyPeriod === 'quarter',
        onClick: () => onHistoryPeriod(historyPeriod === 'quarter' ? 'all' : 'quarter'),
      },
    ];
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <FilterChip key={chip.id} label={chip.label} active={chip.active} onClick={chip.onClick} />
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenSheet}
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border transition active:scale-[0.96] ${
          sheetActive ? apptFilterBtnActive : apptFilterBtnIdle
        }`}
        aria-label={sheetAriaLabel}
        aria-expanded={sheetOpen}
      >
        <HiFunnel className="h-4 w-4" aria-hidden />
        {sheetActive ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#F47C8C]" aria-hidden />
        ) : null}
      </button>
    </div>
  );
}
