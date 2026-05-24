import { HiCalendarDays, HiClock, HiSparkles } from 'react-icons/hi2';
import {
  durationMinutesBetween,
  formatDurationRu,
  formatPreviewLine,
  templateDisplayLabel,
  windowsCountRu,
} from './scheduleUtils';
import type { WindowTemplate } from './scheduleTypes';
import { adminFormSheetHighlight } from '../shared/adminFormSheetTheme';
import { formatRepeatSummary, type RepeatSettingsValue } from './repeatSettingsConfig';
import { countRepeatDates } from './scheduleUtils';

type Props = {
  dateIso: string;
  startTime: string;
  endTime: string;
  serviceLabel: string;
  selectedTemplate: WindowTemplate | null;
  manualMode: boolean;
  repeatSettings: RepeatSettingsValue;
  creatableCount: number;
  totalPlanned: number;
};

export function AddWindowFormSummary({
  dateIso,
  startTime,
  endTime,
  serviceLabel,
  selectedTemplate,
  manualMode,
  repeatSettings,
  creatableCount,
  totalPlanned,
}: Props) {
  const duration = durationMinutesBetween(startTime, endTime);
  const slotLine = formatPreviewLine(dateIso, startTime, endTime);
  const repeatDateCount = countRepeatDates(dateIso, repeatSettings);
  const repeatText = formatRepeatSummary(
    repeatSettings,
    repeatDateCount > 0 ? repeatDateCount : undefined,
  );

  return (
    <div
      className={`${adminFormSheetHighlight} border border-[#FDE8ED] bg-gradient-to-br from-[#FFF9FB] to-white`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]">Итог</p>
      <p className="mt-2 text-[20px] font-black leading-tight tracking-[-0.04em] text-[#111827] lg:text-[22px]">
        {serviceLabel}
      </p>
      <p className="mt-1 text-[14px] font-semibold text-[#6B7280]">{slotLine}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/80 px-3 py-2 ring-1 ring-[#FDE8ED]">
          <HiCalendarDays className="h-5 w-5 shrink-0 text-[#ff5f7a]" aria-hidden />
          <span className="text-[13px] font-semibold text-[#374151]">{formatDurationRu(duration)}</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/80 px-3 py-2 ring-1 ring-[#FDE8ED]">
          <HiClock className="h-5 w-5 shrink-0 text-[#ff5f7a]" aria-hidden />
          <span className="min-w-0 text-[13px] font-semibold leading-snug text-[#374151]">{repeatText}</span>
        </div>
      </div>

      {selectedTemplate && !manualMode ? (
        <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#6B7280]">
          <HiSparkles className="h-4 w-4 shrink-0 text-[#ff5f7a]" aria-hidden />
          Шаблон: {templateDisplayLabel(selectedTemplate)}
        </p>
      ) : null}

      <p className="mt-4 rounded-[14px] bg-[#FFF1F4] px-3 py-2.5 text-[13px] font-bold text-[#ff5f7a]">
        {creatableCount === totalPlanned
          ? `Будет создано: ${windowsCountRu(creatableCount)}`
          : `Создастся ${windowsCountRu(creatableCount)} из ${totalPlanned}`}
      </p>
    </div>
  );
}
