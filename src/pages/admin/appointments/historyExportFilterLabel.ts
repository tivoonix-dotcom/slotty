import type { HistoryPeriodFilter, HistorySort, HistoryStatusFilter } from './appointmentsTypes';

const STATUS_LABELS: Record<HistoryStatusFilter, string> = {
  all: 'Все статусы',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const PERIOD_LABELS: Record<HistoryPeriodFilter, string> = {
  all: 'Всё время',
  month: 'Месяц',
  quarter: '3 месяца',
};

const SORT_LABELS: Record<HistorySort, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  price_high: 'Дороже',
  price_low: 'Дешевле',
};

export function buildHistoryExportFiltersLabel(params: {
  service: string;
  status: HistoryStatusFilter;
  period: HistoryPeriodFilter;
  sort: HistorySort;
  search?: string;
}): string {
  const parts = [
    params.search?.trim() ? `Поиск: «${params.search.trim()}»` : null,
    params.service === 'all' ? 'Все услуги' : params.service,
    STATUS_LABELS[params.status],
    PERIOD_LABELS[params.period],
    SORT_LABELS[params.sort],
  ].filter(Boolean);
  return parts.join(' · ');
}
