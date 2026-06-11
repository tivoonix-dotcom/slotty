import { useCallback, useEffect, useRef, useState } from 'react';
import { HiCalendarDays, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import {
  buildDateStripItems,
  CATALOG_CALENDAR_MAX_DAYS,
  CATALOG_DATE_STRIP_DAYS,
  formatIsoDateLocal,
} from './catalogFilterDateTime';
import { CatalogFilterDateCalendarSheet } from './CatalogFilterDateCalendarSheet';

function startOfLocalDay(base = new Date()): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

type Props = {
  selectedOffset: number | null;
  onChange: (offset: number | null) => void;
  /** Доп. ISO-дата для календаря (если offset > strip). */
  calendarMaxDays?: number;
};

export function CatalogFilterDateStrip({
  selectedOffset,
  onChange,
  calendarMaxDays = CATALOG_CALENDAR_MAX_DAYS,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [items] = useState(() => buildDateStripItems(CATALOG_DATE_STRIP_DAYS));
  const todayIso = formatIsoDateLocal(startOfLocalDay());
  const maxIso = formatIsoDateLocal(
    (() => {
      const d = startOfLocalDay();
      d.setDate(d.getDate() + calendarMaxDays);
      return d;
    })(),
  );

  const scrollByCards = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (selectedOffset == null) return;
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-date-offset="${selectedOffset}"]`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedOffset]);

  return (
    <>
      <div className="flex min-w-0 items-stretch gap-1.5">
        <button
          type="button"
          aria-label="Прокрутить даты назад"
          onClick={() => scrollByCards(-1)}
          className="flex h-[5.25rem] w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#F0F0F2] text-[#6B7280] transition hover:bg-[#E8E8EA] active:scale-95"
        >
          <HiChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const active = selectedOffset === item.offset;
            const bottomLabel = item.isToday ? 'сегодня' : item.isTomorrow ? 'завтра' : item.monthShort;

            return (
              <button
                key={item.iso}
                type="button"
                data-date-offset={item.offset}
                aria-pressed={active}
                onClick={() => onChange(active ? null : item.offset)}
                className={`flex h-[5.25rem] w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-[14px] border px-1 transition active:scale-[0.98] ${
                  active
                    ? 'border-[#F47C8C] bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.35)]'
                    : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[#F47C8C]/35 hover:bg-[#FFF8F9]'
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    active ? 'text-white/95' : 'text-[#6B7280]'
                  }`}
                >
                  {item.weekdayShort}
                </span>
                <span className={`text-[22px] font-bold leading-none ${active ? 'text-white' : 'text-[#111827]'}`}>
                  {item.dayNum}
                </span>
                <span className={`text-[11px] font-medium ${active ? 'text-white/90' : 'text-[#9CA3AF]'}`}>
                  {bottomLabel}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Прокрутить даты вперёд"
          onClick={() => scrollByCards(1)}
          className="flex h-[5.25rem] w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#F0F0F2] text-[#6B7280] transition hover:bg-[#E8E8EA] active:scale-95"
        >
          <HiChevronRight className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          aria-label="Выбрать дату в календаре"
          aria-expanded={calendarOpen}
          onClick={() => setCalendarOpen(true)}
          className={`flex h-[5.25rem] w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] border transition active:scale-[0.98] ${
            calendarOpen
              ? 'border-[#F47C8C] bg-[#FFF1F4] text-[#F47C8C]'
              : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#F47C8C]/35 hover:bg-[#FFF8F9]'
          }`}
        >
          <HiCalendarDays className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <CatalogFilterDateCalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedOffset={selectedOffset}
        onSelectOffset={onChange}
        minIso={todayIso}
        maxIso={maxIso}
      />
    </>
  );
}
