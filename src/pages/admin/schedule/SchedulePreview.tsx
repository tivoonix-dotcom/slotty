import { useMemo, useState } from 'react';
import { HiClock } from 'react-icons/hi2';
import type { PlannedSlot } from './scheduleTypes';
import { formatSlotDayParts, serviceTitleById, windowsCountRu } from './scheduleUtils';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';

const COLLAPSED_DAY_LIMIT = 5;

type Props = {
  slots: PlannedSlot[];
  services: MasterOnboardingService[];
  serviceName?: string;
  creatableCount?: number;
  beyondHorizon?: number;
  horizonDays?: number | null;
};

type DayRow = {
  dateIso: string;
  slot: PlannedSlot;
};

export function SchedulePreview({
  slots,
  services,
  serviceName,
  creatableCount,
  beyondHorizon = 0,
  horizonDays,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const dayRows = useMemo((): DayRow[] => {
    const sorted = [...slots].sort((a, b) => {
      const d = a.dateIso.localeCompare(b.dateIso);
      if (d !== 0) return d;
      return a.startTime.localeCompare(b.startTime);
    });
    return sorted.map((slot) => ({ dateIso: slot.dateIso, slot }));
  }, [slots]);

  if (slots.length === 0) return null;

  const willCreate = creatableCount ?? slots.length;
  const title =
    willCreate === slots.length
      ? slots.length === 1
        ? 'Будет создано 1 окно'
        : `Будет создано: ${windowsCountRu(slots.length)}`
      : `Создастся ${windowsCountRu(willCreate)} из ${slots.length}`;

  const needsCollapse = dayRows.length > COLLAPSED_DAY_LIMIT;
  const visibleRows = expanded || !needsCollapse ? dayRows : dayRows.slice(0, COLLAPSED_DAY_LIMIT);

  const nameForSlot = (s: PlannedSlot) => serviceName ?? serviceTitleById(services, s.serviceId);

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#FDE8ED] bg-white">
      <div className="border-b border-[#FDE8ED] bg-gradient-to-r from-[#FFF9FB] to-white px-4 py-3.5">
        <p className="text-[15px] font-black tracking-[-0.03em] text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-[#6B7280]">Проверьте даты и время перед сохранением</p>
      </div>

      <ul
        className={`space-y-2 p-3 ${expanded && needsCollapse ? 'max-h-[min(16rem,42vh)] overflow-y-auto overscroll-y-auto' : ''}`}
      >
        {visibleRows.map(({ dateIso, slot }, index) => {
          const parts = formatSlotDayParts(dateIso);
          const name = nameForSlot(slot);
          return (
            <li
              key={`${dateIso}-${slot.startTime}-${index}`}
              className="flex gap-3 rounded-[16px] bg-[#f6f7fb] px-3 py-2.5 ring-1 ring-[#EAECEF]/80"
            >
              <div
                className={`flex w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-[12px] py-1.5 ${
                  parts.isToday ? 'bg-[#FFF1F4] ring-1 ring-[#FDE8ED]' : 'bg-white'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  {parts.weekday}
                </span>
                <span className="text-[20px] font-black leading-none tabular-nums text-[#111827]">
                  {parts.day}
                </span>
                <span className="text-[10px] font-semibold capitalize text-[#6B7280]">{parts.month}</span>
              </div>

              <div className="min-w-0 flex-1 py-0.5">
                <div className="flex items-center gap-1.5">
                  <HiClock className="h-4 w-4 shrink-0 text-[#ff5f7a]" aria-hidden />
                  <p className="text-[15px] font-black tabular-nums tracking-[-0.02em] text-[#111827]">
                    {slot.startTime}
                    <span className="mx-1 font-semibold text-[#9CA3AF]">–</span>
                    {slot.endTime}
                  </p>
                </div>
                {name ? (
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[#6B7280]">
                    {name}
                  </p>
                ) : null}
                {parts.isToday ? (
                  <span className="mt-1.5 inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ff5f7a]">
                    Сегодня
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {needsCollapse ? (
        <div className="border-t border-[#FDE8ED] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[13px] font-bold text-[#ff5f7a]"
          >
            {expanded ? 'Свернуть' : `Показать все ${dayRows.length} дат`}
          </button>
        </div>
      ) : null}

      {beyondHorizon > 0 && horizonDays != null && horizonDays > 0 ? (
        <p className="border-t border-[#FDE8ED] px-4 py-3 text-[12px] font-semibold leading-snug text-[#B66A24]">
          {beyondHorizon} {beyondHorizon === 1 ? 'дата выходит' : 'дат выходят'} за горизонт тарифа ({horizonDays}{' '}
          дней) и не {beyondHorizon === 1 ? 'будет' : 'будут'} созданы.
        </p>
      ) : null}
    </section>
  );
}
