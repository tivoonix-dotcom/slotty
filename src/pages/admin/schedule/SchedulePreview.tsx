import { useMemo, useState } from 'react';
import type { PlannedSlot } from './scheduleTypes';
import {
  formatGroupHeader,
  formatPreviewLine,
  parseIsoDate,
  serviceTitleById,
  startOfLocalDay,
  windowsCountRu,
} from './scheduleUtils';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';

const COLLAPSED_SLOT_LIMIT = 6;

type Props = {
  slots: PlannedSlot[];
  services: MasterOnboardingService[];
  serviceName?: string;
  creatableCount?: number;
  beyondHorizon?: number;
  horizonDays?: number | null;
};

type GroupedDay = {
  dateIso: string;
  header: string;
  items: PlannedSlot[];
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

  const grouped = useMemo((): GroupedDay[] => {
    const todayStart = startOfLocalDay(new Date());
    const byDate = new Map<string, PlannedSlot[]>();
    for (const slot of slots) {
      const list = byDate.get(slot.dateIso) ?? [];
      list.push(slot);
      byDate.set(slot.dateIso, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateIso, items]) => ({
        dateIso,
        header: formatGroupHeader(parseIsoDate(dateIso), todayStart),
        items: items.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [slots]);

  const flatSlots = useMemo(
    () => grouped.flatMap((g) => g.items.map((item) => ({ ...item, groupHeader: g.header }))),
    [grouped],
  );

  if (slots.length === 0) return null;

  const willCreate = creatableCount ?? slots.length;
  const title =
    willCreate === slots.length
      ? slots.length === 1
        ? 'Будет создано 1 окно'
        : `Будет создано: ${windowsCountRu(slots.length)}`
      : `Будет создано ${windowsCountRu(willCreate)} из ${slots.length}`;

  const needsCollapse = flatSlots.length > COLLAPSED_SLOT_LIMIT;
  const visibleSlots = expanded || !needsCollapse ? flatSlots : flatSlots.slice(0, COLLAPSED_SLOT_LIMIT);

  const nameForSlot = (s: PlannedSlot) => serviceName ?? serviceTitleById(services, s.serviceId);

  return (
    <section className="rounded-[22px] bg-[#FFF5F5] px-4 py-3.5 ring-1 ring-[#E29595]/15">
      <p className="text-[14px] font-semibold text-neutral-900">{title}</p>
      <p className="mt-0.5 text-[12px] text-neutral-500">Проверь окна перед добавлением</p>

      <ul
        className={`mt-3 space-y-2 ${expanded && needsCollapse ? 'max-h-[min(14rem,40vh)] overflow-y-auto overscroll-y-auto pr-0.5' : ''}`}
      >
        {visibleSlots.map((s, index) => {
          const prev = index > 0 ? visibleSlots[index - 1] : null;
          const showHeader = !prev || prev.groupHeader !== s.groupHeader;
          const name = nameForSlot(s);
          return (
            <li key={`${s.dateIso}-${s.startTime}-${index}`}>
              {showHeader ? (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  {s.groupHeader}
                </p>
              ) : null}
              <p className="text-[13px] font-medium text-neutral-700">
                {formatPreviewLine(s.dateIso, s.startTime, s.endTime)}
                {name ? <span className="text-neutral-500"> · {name}</span> : null}
              </p>
            </li>
          );
        })}
      </ul>

      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[13px] font-semibold text-[#C97B7B]"
        >
          {expanded
            ? 'Свернуть список'
            : `Показать все: ${windowsCountRu(flatSlots.length)}`}
        </button>
      ) : null}

      {beyondHorizon > 0 && horizonDays != null && horizonDays > 0 ? (
        <p className="mt-3 text-[12px] font-semibold leading-snug text-[#B66A24]">
          {beyondHorizon} {beyondHorizon === 1 ? 'дата выходит' : 'дат выходят'} за горизонт тарифа ({horizonDays}{' '}
          дней) и не будут созданы.
        </p>
      ) : null}
    </section>
  );
}
