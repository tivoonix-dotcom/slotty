import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogFilterChipClass,
  catalogFilterSectionClass,
  catalogFilterSegmentClass,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { ADMIN_SEGMENT_NAV_DESKTOP } from '../adminCabinetLayout';
import { sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';
import type {
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsFeatureFilter,
  RequestsPeriodFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';

function FilterChipGroup<T extends string>({
  title,
  options,
  value,
  onChange,
  layout = 'chips',
}: {
  title: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  /** `chips` — длинные подписи (услуги); `segments` — короткие опции в серой дорожке. */
  layout?: 'chips' | 'segments';
}) {
  const optionButtons = options.map((option) => {
    const selected = value === option.id;
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => onChange(option.id)}
        aria-pressed={selected}
        className={
          layout === 'segments' ? catalogFilterSegmentClass(selected) : catalogFilterChipClass(selected)
        }
      >
        {option.label}
      </button>
    );
  });

  return (
    <section className={catalogFilterSectionClass}>
      <p className={sheetSectionTitleClass}>{title}</p>
      {layout === 'segments' ? (
        <div className={`${ADMIN_SEGMENT_NAV_DESKTOP} relative mt-3`} role="group" aria-label={title}>
          {optionButtons}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={title}>
          {optionButtons}
        </div>
      )}
    </section>
  );
}

type ServiceOption = { id: string; label: string };

type RequestsProps = {
  mode: 'requests';
  serviceOptions: ServiceOption[];
  service: string;
  onService: (id: string) => void;
  sort: RequestsSort;
  onSort: (sort: RequestsSort) => void;
  period: RequestsPeriodFilter;
  onPeriod: (period: RequestsPeriodFilter) => void;
  feature: RequestsFeatureFilter;
  onFeature: (feature: RequestsFeatureFilter) => void;
  onReset: () => void;
};

type UpcomingProps = {
  mode: 'upcoming';
  serviceOptions: ServiceOption[];
  service: string;
  onService: (id: string) => void;
  sort: UpcomingSort;
  onSort: (sort: UpcomingSort) => void;
  onReset: () => void;
};

type HistoryProps = {
  mode: 'history';
  serviceOptions: ServiceOption[];
  service: string;
  onService: (id: string) => void;
  sort: HistorySort;
  onSort: (sort: HistorySort) => void;
  status: HistoryStatusFilter;
  onStatus: (status: HistoryStatusFilter) => void;
  period: HistoryPeriodFilter;
  onPeriod: (period: HistoryPeriodFilter) => void;
  onReset: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
} & (RequestsProps | UpcomingProps | HistoryProps);

const REQUESTS_SORT: Array<{ id: RequestsSort; label: string }> = [
  { id: 'newest', label: 'Новые' },
  { id: 'oldest', label: 'Старые' },
  { id: 'price_high', label: 'Дороже' },
  { id: 'price_low', label: 'Дешевле' },
];

const REQUESTS_PERIOD: Array<{ id: RequestsPeriodFilter; label: string }> = [
  { id: 'all', label: 'Все даты' },
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
];

const REQUESTS_FEATURE: Array<{ id: RequestsFeatureFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'expiring', label: 'Срочные' },
  { id: 'with_photo', label: 'С фото' },
];

const UPCOMING_SORT: Array<{ id: UpcomingSort; label: string }> = [
  { id: 'date', label: 'По дате' },
  { id: 'newest', label: 'Новые' },
];

const HISTORY_STATUS: Array<{ id: HistoryStatusFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'completed', label: 'Завершено' },
  { id: 'cancelled', label: 'Отменено' },
];

const HISTORY_PERIOD: Array<{ id: HistoryPeriodFilter; label: string }> = [
  { id: 'all', label: 'Всё время' },
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: '3 месяца' },
];

const HISTORY_SORT: Array<{ id: HistorySort; label: string }> = [
  { id: 'newest', label: 'Новые' },
  { id: 'oldest', label: 'Старые' },
  { id: 'price_high', label: 'Дороже' },
  { id: 'price_low', label: 'Дешевле' },
];

export function AppointmentsFiltersSheet(props: Props) {
  const { open, onClose, mode } = props;

  const hasActive =
    mode === 'requests'
      ? props.service !== 'all' ||
        props.sort !== 'newest' ||
        props.period !== 'all' ||
        props.feature !== 'all'
      : mode === 'upcoming'
        ? props.service !== 'all' || props.sort !== 'date'
        : props.service !== 'all' ||
          props.sort !== 'newest' ||
          props.status !== 'all' ||
          props.period !== 'all';

  const serviceOptions = props.serviceOptions.map((opt) => ({ id: opt.id, label: opt.label }));

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Фильтры"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" className={catalogSheetPrimaryBtn} onClick={onClose}>
            Готово
          </button>
          {hasActive ? (
            <button
              type="button"
              className={catalogSheetSecondaryBtn}
              onClick={() => {
                props.onReset();
                onClose();
              }}
            >
              Сбросить
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-3">
        <FilterChipGroup
          title="Услуга"
          options={serviceOptions}
          value={props.service}
          onChange={props.onService}
          layout="chips"
        />

        {mode === 'history' ? (
          <>
            <FilterChipGroup
              title="Статус"
              options={HISTORY_STATUS}
              value={props.status}
              onChange={props.onStatus}
              layout="segments"
            />
            <FilterChipGroup
              title="Период"
              options={HISTORY_PERIOD}
              value={props.period}
              onChange={props.onPeriod}
              layout="segments"
            />
            <FilterChipGroup
              title="Сортировка"
              options={HISTORY_SORT}
              value={props.sort}
              onChange={props.onSort}
              layout="segments"
            />
          </>
        ) : mode === 'requests' ? (
          <>
            <FilterChipGroup
              title="Дата"
              options={REQUESTS_PERIOD}
              value={props.period}
              onChange={props.onPeriod}
              layout="segments"
            />
            <FilterChipGroup
              title="Сортировка"
              options={REQUESTS_SORT}
              value={props.sort}
              onChange={props.onSort}
              layout="segments"
            />
            <FilterChipGroup
              title="Ещё"
              options={REQUESTS_FEATURE}
              value={props.feature}
              onChange={props.onFeature}
              layout="segments"
            />
          </>
        ) : (
          <FilterChipGroup
            title="Сортировка"
            options={UPCOMING_SORT}
            value={props.sort}
            onChange={(id) => props.onSort(id as UpcomingSort)}
            layout="segments"
          />
        )}
      </div>
    </AdminBottomSheet>
  );
}
