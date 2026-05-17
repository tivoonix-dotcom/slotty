import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { apptChipActive, apptPinkBtn } from './adminAppointmentsTheme';
import type {
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';

const optionRow = (selected: boolean) =>
  `flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
    selected
      ? apptChipActive
      : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
  }`;

function OptionCheck({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F47C8C] text-white">
      <HiCheck className="h-5 w-5" aria-hidden />
    </span>
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]" aria-hidden />
  );
}

function OptionButton({
  selected,
  label,
  hint,
  onClick,
}: {
  selected: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={optionRow(selected)}>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-[#111827]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">{hint}</span>
        ) : null}
      </span>
      <OptionCheck selected={selected} />
    </button>
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

const REQUESTS_SORT: Array<{ id: RequestsSort; label: string; hint: string }> = [
  { id: 'newest', label: 'Сначала новые', hint: 'Последние заявки сверху' },
  { id: 'oldest', label: 'Сначала старые', hint: 'От ранних к поздним' },
];

const UPCOMING_SORT: Array<{ id: UpcomingSort; label: string; hint: string }> = [
  { id: 'date', label: 'По дате', hint: 'Ближайшие визиты сверху' },
  { id: 'newest', label: 'Сначала новые', hint: 'Недавно добавленные' },
];

const HISTORY_STATUS: Array<{ id: HistoryStatusFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Все статусы', hint: 'Завершённые и отменённые' },
  { id: 'completed', label: 'Завершено', hint: 'Только завершённые визиты' },
  { id: 'cancelled', label: 'Отменено', hint: 'Отменённые и отклонённые' },
];

const HISTORY_PERIOD: Array<{ id: HistoryPeriodFilter; label: string; hint: string }> = [
  { id: 'all', label: 'За всё время', hint: 'Вся история' },
  { id: 'month', label: 'Последний месяц', hint: '30 дней' },
  { id: 'quarter', label: '3 месяца', hint: '90 дней' },
];

const HISTORY_SORT: Array<{ id: HistorySort; label: string; hint: string }> = [
  { id: 'newest', label: 'Сначала новые', hint: 'Недавние записи сверху' },
  { id: 'oldest', label: 'Сначала старые', hint: 'От старых к новым' },
  { id: 'price_high', label: 'Дороже', hint: 'По убыванию суммы' },
  { id: 'price_low', label: 'Дешевле', hint: 'По возрастанию суммы' },
];

export function AppointmentsFiltersSheet(props: Props) {
  const { open, onClose, mode } = props;

  const hasActive =
    mode === 'requests'
      ? props.service !== 'all' || props.sort !== 'newest'
      : mode === 'upcoming'
        ? props.service !== 'all' || props.sort !== 'date'
        : props.service !== 'all' ||
          props.sort !== 'newest' ||
          props.status !== 'all' ||
          props.period !== 'all';

  const title =
    mode === 'requests' ? 'Фильтр заявок' : mode === 'upcoming' ? 'Фильтр записей' : 'Фильтр истории';

  return (
    <AdminBottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        {mode === 'history' ? (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Услуга</p>
              <div className="mt-2 space-y-2">
                {props.serviceOptions.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.service === opt.id}
                    label={opt.label}
                    hint={opt.id === 'all' ? 'Все услуги' : undefined}
                    onClick={() => props.onService(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Сортировка</p>
              <div className="mt-2 space-y-2">
                {HISTORY_SORT.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.sort === opt.id}
                    label={opt.label}
                    hint={opt.hint}
                    onClick={() => props.onSort(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Статус</p>
              <div className="mt-2 space-y-2">
                {HISTORY_STATUS.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.status === opt.id}
                    label={opt.label}
                    hint={opt.hint}
                    onClick={() => props.onStatus(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Период</p>
              <div className="mt-2 space-y-2">
                {HISTORY_PERIOD.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.period === opt.id}
                    label={opt.label}
                    hint={opt.hint}
                    onClick={() => props.onPeriod(opt.id)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Услуга</p>
              <div className="mt-2 space-y-2">
                {props.serviceOptions.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.service === opt.id}
                    label={opt.label}
                    hint={opt.id === 'all' ? 'Все услуги' : undefined}
                    onClick={() => props.onService(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Сортировка</p>
              <div className="mt-2 space-y-2">
                {(mode === 'requests' ? REQUESTS_SORT : UPCOMING_SORT).map((opt) => (
                  <OptionButton
                    key={opt.id}
                    selected={props.sort === opt.id}
                    label={opt.label}
                    hint={opt.hint}
                    onClick={() =>
                      mode === 'requests'
                        ? props.onSort(opt.id as RequestsSort)
                        : props.onSort(opt.id as UpcomingSort)
                    }
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-[#F3F4F6] pt-4">
          <button type="button" className={apptPinkBtn} onClick={onClose}>
            Готово
          </button>
          {hasActive ? (
            <button
              type="button"
              className="text-[14px] font-semibold text-[#F47C8C]"
              onClick={() => {
                props.onReset();
                onClose();
              }}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </div>
    </AdminBottomSheet>
  );
}
