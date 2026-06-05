import { useMemo, useState } from 'react';
import { HiCalendarDays, HiFunnel, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { AdminCabinetCrossLink } from '../shared/AdminCabinetCrossLink';
import type { ScheduleSlotsStatusFilter, ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import {
  DEFAULT_SLOTS_FILTERS,
  ScheduleSlotsFiltersSheet,
  type ScheduleSlotsFilters,
} from './ScheduleSlotsFiltersSheet';
import {
  scheduleListGroupCard,
  scheduleListToolbar,
  scheduleSegmentClass,
  scheduleSheetGhostBtn,
  scheduleSlotsDayHeader,
  scheduleSlotsFilterBtn,
  scheduleSlotsFilterBtnActive,
  scheduleSlotsStatChip,
} from './adminScheduleTheme';
import { catalogSheetField } from '../shared/adminCatalogSheetTheme';
import { formatGroupHeader, parseIsoDate, startOfLocalDay, windowsCountRu } from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

const STATUS_FILTER_LABELS: Record<ScheduleSlotsStatusFilter, string> = {
  all: 'Все',
  free: 'Свободные',
  booked: 'С записью',
  blocked: 'Недоступные',
};

const QUICK_STATUS: Array<{ value: ScheduleSlotsStatusFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Свободные' },
  { value: 'booked', label: 'С записью' },
  { value: 'blocked', label: 'Закрытые' },
];

function windowMatchesQuery(w: ScheduleWindowView, q: string): boolean {
  const haystack = `${w.serviceName} ${w.clientName ?? ''} ${w.clientPhone ?? ''} ${w.dateIso} ${w.startTime}`.toLowerCase();
  return haystack.includes(q);
}

function isUpcomingWindow(w: ScheduleWindowView): boolean {
  const end = new Date(`${w.dateIso}T${w.endTime}:00`);
  return end.getTime() >= Date.now();
}

function formatDayChip(iso: string): string {
  const d = parseIsoDate(iso);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
}

type FilterChip = {
  key: string;
  label: string;
  onClear: () => void;
};

export function ScheduleSlotsListTab({ windows, loading, onWindowClick }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ScheduleSlotsFilters>(DEFAULT_SLOTS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counts = useMemo(
    () => ({
      free: windows.filter((w) => w.status === 'free').length,
      booked: windows.filter((w) => w.status === 'booked').length,
      blocked: windows.filter((w) => w.status === 'blocked').length,
      total: windows.length,
    }),
    [windows],
  );

  const filtersActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];
    if (filters.status !== 'all') {
      chips.push({
        key: 'status',
        label: STATUS_FILTER_LABELS[filters.status],
        onClear: () => setFilters((prev) => ({ ...prev, status: 'all' })),
      });
    }
    if (filters.dayIso) {
      chips.push({
        key: 'day',
        label: formatDayChip(filters.dayIso),
        onClear: () => setFilters((prev) => ({ ...prev, dayIso: '' })),
      });
    }
    if (filters.onlyUpcoming) {
      chips.push({
        key: 'upcoming',
        label: 'Предстоящие',
        onClear: () => setFilters((prev) => ({ ...prev, onlyUpcoming: false })),
      });
    }
    return chips;
  }, [filters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return windows
      .filter((w) => {
        if (filters.dayIso && w.dateIso !== filters.dayIso) return false;
        if (filters.onlyUpcoming && !isUpcomingWindow(w)) return false;
        if (filters.status !== 'all' && w.status !== filters.status) return false;
        if (q && !windowMatchesQuery(w, q)) return false;
        return true;
      })
      .sort((a, b) => {
        const d = a.dateIso.localeCompare(b.dateIso);
        if (d !== 0) return d;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [filters, query, windows]);

  const grouped = useMemo(() => {
    const todayStart = startOfLocalDay(new Date());
    const map = new Map<string, ScheduleWindowView[]>();
    for (const w of filtered) {
      const list = map.get(w.dateIso) ?? [];
      list.push(w);
      map.set(w.dateIso, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateIso, items]) => ({
        dateIso,
        header: formatGroupHeader(parseIsoDate(dateIso), todayStart),
        items,
      }));
  }, [filtered]);

  const patchFilters = (patch: Partial<ScheduleSlotsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <section className="w-full min-w-0 space-y-4 lg:space-y-5">
      <div className={scheduleListToolbar}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={scheduleSlotsStatChip}>
            <span className="text-[#6B7280]">Своб.</span>
            <span className="font-bold tabular-nums">{counts.free}</span>
          </span>
          <span className={scheduleSlotsStatChip}>
            <span className="text-[#6B7280]">Зан.</span>
            <span className="font-bold tabular-nums">{counts.booked}</span>
          </span>
          <span className={scheduleSlotsStatChip}>
            <span className="text-[#6B7280]">Всего</span>
            <span className="font-bold tabular-nums">{counts.total}</span>
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Поиск по окнам</span>
            <HiMagnifyingGlass
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Услуга, клиент, время…"
              className={`${catalogSheetField} pl-11`}
            />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={`${scheduleSlotsFilterBtn} ${filtersActive ? scheduleSlotsFilterBtnActive : ''}`}
            aria-label="Фильтры"
            aria-expanded={filtersOpen}
          >
            <HiFunnel className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div
          className="mt-3 grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5 sm:grid-cols-4"
          role="tablist"
          aria-label="Статус окна"
        >
          {QUICK_STATUS.map((opt) => {
            const selected = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => patchFilters({ status: opt.value })}
                className={`min-h-10 ${scheduleSegmentClass(selected)}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filterChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EBEBEB] py-1.5 pl-3 pr-2 text-[12px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98]"
              >
                <span className="truncate">{chip.label}</span>
                <HiXMark className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_SLOTS_FILTERS)}
              className={`${scheduleSheetGhostBtn} shrink-0`}
            >
              Сбросить
            </button>
          </div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <p className="mt-3 text-[13px] font-medium text-[#6B7280]">
            Показано{' '}
            <span className="font-semibold text-[#111827]">{windowsCountRu(filtered.length)}</span>
            {filtered.length !== windows.length ? (
              <span> из {windows.length}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center rounded-[16px] bg-white py-12 ring-1 ring-[#EEEEEE]">
          <LoadingVideo size="sm" label="Загрузка окон…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[16px] bg-white p-8 text-center ring-1 ring-[#EEEEEE]">
          {windows.length === 0 ? (
            <MiniPicture name="scheduleEmpty" variant="empty" className="mb-2" />
          ) : (
            <MiniPicture name="searchEmpty" variant="empty" className="mb-2" />
          )}
          <h3 className="mt-2 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">
            {windows.length === 0 ? 'Окон пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[20rem] text-[14px] font-medium leading-relaxed text-[#6B7280]">
            {windows.length === 0
              ? 'Создайте первое окно — клиенты смогут выбрать время для записи'
              : 'Измените поиск или сбросьте фильтры'}
          </p>
          {windows.length === 0 ? (
            <div className="mx-auto mt-5 max-w-[16rem]">
              <AdminCabinetCrossLink to={`${ADMIN_SCHEDULE_PATH}?tab=create`}>
                Создать окно
              </AdminCabinetCrossLink>
            </div>
          ) : null}
          {windows.length > 0 && filtersActive ? (
            <button
              type="button"
              className={`${scheduleSheetGhostBtn} mt-4`}
              onClick={() => setFilters(DEFAULT_SLOTS_FILTERS)}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Мобилка: плоский список по дням */}
          <div className="space-y-1 lg:hidden">
            {grouped.map((group) => (
              <section key={group.dateIso}>
                <div className={scheduleSlotsDayHeader}>
                  <h4 className="text-[15px] font-bold text-[#111827]">{group.header}</h4>
                  <span className="shrink-0 text-[12px] font-semibold text-[#6B7280]">
                    {windowsCountRu(group.items.length)}
                  </span>
                </div>
                <ul className="space-y-2 pb-3">
                  {group.items.map((w) => (
                    <li key={w.id}>
                      <ScheduleWindowCard window={w} onClick={() => onWindowClick(w)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Desktop: группы в белых карточках */}
          <div className="hidden space-y-4 lg:block">
            {grouped.map((group) => (
              <section key={group.dateIso} className={scheduleListGroupCard}>
                <div className={scheduleSlotsDayHeader}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280]"
                      aria-hidden
                    >
                      <HiCalendarDays className="h-5 w-5" />
                    </span>
                    <h4 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
                      {group.header}
                    </h4>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#EBEBEB] px-3 py-1 text-[12px] font-semibold text-[#111827]">
                    {windowsCountRu(group.items.length)}
                  </span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {group.items.map((w) => (
                    <li key={w.id}>
                      <ScheduleWindowCard window={w} onClick={() => onWindowClick(w)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <ScheduleSlotsFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_SLOTS_FILTERS)}
        resultCount={filtered.length}
      />
    </section>
  );
}
