import { useEffect, useMemo, useState } from 'react';
import {
  HiCalendarDays,
  HiClock,
  HiFunnel,
  HiMagnifyingGlass,
  HiRectangleStack,
  HiUser,
} from 'react-icons/hi2';
import type { ScheduleSlotsStatusFilter, ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import {
  DEFAULT_SLOTS_FILTERS,
  ScheduleSlotsFiltersSheet,
  type ScheduleSlotsFilters,
} from './ScheduleSlotsFiltersSheet';
import { scheduleListGroupCard, scheduleListToolbar } from './adminScheduleTheme';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import {
  scheduleChipActive,
  scheduleFilterBtnActive,
  scheduleFilterBtnIdle,
  scheduleIconCircle,
  scheduleInput,
} from './scheduleUi';
import { formatGroupHeader, parseIsoDate, startOfLocalDay, windowsCountRu } from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  focusDayIso?: string | null;
  slotStats: ScheduleTabMetrics['list'];
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

function ListStatsStrip({ stats }: { stats: ScheduleTabMetrics['list'] }) {
  const tiles = [
    {
      label: 'Свободно',
      value: stats.free,
      hint: 'Можно записать',
      icon: HiClock,
      accent: 'from-[#ff6f88] to-[#ff5f7a]',
    },
    {
      label: 'Занято',
      value: stats.booked,
      hint: 'С записью',
      icon: HiUser,
      accent: 'from-[#111827] to-[#374151]',
    },
    {
      label: 'Всего',
      value: stats.total,
      hint: 'В расписании',
      icon: HiRectangleStack,
      accent: 'from-[#C9A0DC] to-[#9B7BB8]',
    },
  ] as const;

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] lg:hidden"
      aria-label="Сводка по окнам"
    >
      {tiles.map((t) => (
        <article
          key={t.label}
          className="flex min-w-[9.5rem] shrink-0 flex-col justify-between rounded-[20px] border border-[#FDE8ED] bg-white p-3.5 shadow-[0_6px_20px_rgba(255,95,122,0.08)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">{t.label}</p>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${t.accent} text-white shadow-[0_6px_16px_rgba(255,95,122,0.2)]`}
            >
              <t.icon className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-[28px] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
            {t.value}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">{t.hint}</p>
        </article>
      ))}
    </div>
  );
}

export function ScheduleSlotsListTab({ windows, loading, focusDayIso, slotStats, onWindowClick }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ScheduleSlotsFilters>(DEFAULT_SLOTS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!focusDayIso?.trim()) return;
    setFilters((prev) => ({
      ...prev,
      dayIso: focusDayIso.trim(),
      status: 'free',
      onlyUpcoming: true,
    }));
  }, [focusDayIso]);

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
    <section className="space-y-4 lg:space-y-5">
      <ListStatsStrip stats={slotStats} />

      <div className={scheduleListToolbar}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">Поиск и фильтр</p>
          {filtersActive ? (
            <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1 text-[11px] font-bold text-[#ff5f7a]">
              {activeFilterLabel}
            </span>
          ) : null}
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
              className={`${scheduleInput} border-[#FDE8ED] bg-white pl-11 focus:border-[#ff5f7a] focus:ring-[#FFF1F4]`}
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
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff5f7a]" aria-hidden />
            ) : null}
          </button>
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="Быстрый фильтр по статусу"
        >
          {QUICK_STATUS.map((opt) => {
            const selected = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilters((prev) => ({ ...prev, status: opt.value }))}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition active:scale-[0.98] ${
                  selected
                    ? scheduleChipActive
                    : 'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#ff5f7a]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {!loading && filtered.length > 0 ? (
          <p className="mt-3 text-[13px] font-semibold text-[#6B7280]">
            Показано:{' '}
            <span className="font-black text-[#ff5f7a]">{windowsCountRu(filtered.length)}</span>
            {filtered.length !== windows.length ? (
              <span className="font-medium text-[#9CA3AF]"> из {windows.length}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className={`${scheduleListGroupCard} flex justify-center py-10`}>
          <LoadingVideo size="sm" label="Загрузка окон…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${scheduleListGroupCard} p-8 text-center`}>
          <span className={scheduleIconCircle}>
            <HiRectangleStack className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[20px] font-black tracking-[-0.04em] text-[#111827]">
            {windows.length === 0 ? 'Окон пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[20rem] text-[14px] font-semibold leading-relaxed text-[#6B7280]">
            {windows.length === 0
              ? 'Создайте первое окно во вкладке «Создать»'
              : 'Измените поиск или откройте фильтр'}
          </p>
          {windows.length > 0 && filtersActive ? (
            <button
              type="button"
              className="mt-5 text-[14px] font-bold text-[#ff5f7a]"
              onClick={() => setFilters(DEFAULT_SLOTS_FILTERS)}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <section key={group.dateIso} className={scheduleListGroupCard}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_8px_20px_rgba(255,95,122,0.28)]"
                  aria-hidden
                >
                  <HiCalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[17px] font-black tracking-[-0.04em] text-[#111827] lg:text-[18px]">
                    {group.header}
                  </h4>
                </div>
                <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[12px] font-bold text-[#ff5f7a]">
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
