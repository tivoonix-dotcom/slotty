import { useMemo, useState } from 'react';
import { HiFunnel, HiMagnifyingGlass, HiRectangleStack } from 'react-icons/hi2';
import type { ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import {
  DEFAULT_SLOTS_FILTERS,
  ScheduleSlotsFiltersSheet,
  type ScheduleSlotsFilters,
} from './ScheduleSlotsFiltersSheet';
import {
  scheduleFilterBtnActive,
  scheduleFilterBtnIdle,
  scheduleIconCircle,
  scheduleInput,
  schedulePanelCard,
} from './scheduleUi';
import { formatGroupHeader, parseIsoDate, startOfLocalDay, windowsCountRu } from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

const STATUS_FILTER_LABELS: Record<ScheduleSlotsFilters['status'], string> = {
  all: 'Все',
  free: 'Свободные',
  booked: 'С записью',
  blocked: 'Недоступные',
};

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

export function ScheduleSlotsListTab({ windows, loading, onWindowClick }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ScheduleSlotsFilters>(DEFAULT_SLOTS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.status !== 'all') parts.push(STATUS_FILTER_LABELS[filters.status]);
    if (filters.dayIso) parts.push(formatDayChip(filters.dayIso));
    if (filters.onlyUpcoming) parts.push('Предстоящие');
    return parts.length > 0 ? parts.join(' · ') : 'Все окна';
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

  return (
    <section className="space-y-4">
      <div className={schedulePanelCard}>
        <div className="flex gap-2">
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
              className={`${scheduleInput} pl-11`}
            />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] ${
              filtersActive ? scheduleFilterBtnActive : scheduleFilterBtnIdle
            }`}
            aria-label={`Фильтр: ${activeFilterLabel}`}
            aria-expanded={filtersOpen}
          >
            <HiFunnel className="h-5 w-5" aria-hidden />
            {filtersActive ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E29595]" aria-hidden />
            ) : null}
          </button>
        </div>

        {!loading && filtered.length > 0 ? (
          <p className="mt-3 text-[13px] font-medium text-neutral-500">
            Показано: <span className="font-semibold text-neutral-800">{windowsCountRu(filtered.length)}</span>
            {filtered.length !== windows.length ? (
              <span className="text-neutral-400"> из {windows.length}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className={`${schedulePanelCard} flex justify-center py-6`}>
          <LoadingVideo size="sm" label="Загрузка окон…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${schedulePanelCard} p-6 text-center`}>
          <span className={scheduleIconCircle}>
            <HiRectangleStack className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {windows.length === 0 ? 'Окон пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            {windows.length === 0
              ? 'Создайте первое окно во вкладке «Создать»'
              : 'Измените поиск или откройте фильтр'}
          </p>
          {windows.length > 0 && filtersActive ? (
            <button
              type="button"
              className="mt-4 text-[14px] font-semibold text-[#C97B7B]"
              onClick={() => setFilters(DEFAULT_SLOTS_FILTERS)}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <section key={group.dateIso} className={schedulePanelCard}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-[15px] font-bold tracking-[-0.03em] text-neutral-950">{group.header}</h4>
                <span className="shrink-0 rounded-full bg-[#F1EFEF] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                  {windowsCountRu(group.items.length)}
                </span>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((w) => (
                  <li key={w.id}>
                    <ScheduleWindowCard window={w} onClick={() => onWindowClick(w)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ScheduleSlotsFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_SLOTS_FILTERS)}
      />
    </section>
  );
}
