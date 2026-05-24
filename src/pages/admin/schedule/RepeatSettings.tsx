import { useMemo } from 'react';
import {
  HiArrowPath,
  HiBriefcase,
  HiCalendarDays,
  HiCheck,
  HiSquares2X2,
} from 'react-icons/hi2';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import type { RepeatKind } from './scheduleTypes';
import {
  BIWEEKLY_COUNT_OPTIONS,
  DEFAULT_WEEKDAY_MASK,
  formatRepeatSummary,
  PICK_WEEKDAYS_SPAN_OPTIONS,
  REPEAT_KIND_OPTIONS,
  type RepeatSettingsValue,
  WEEKDAY_SHORT,
  WEEKDAY_SPAN_OPTIONS,
  WEEKLY_COUNT_OPTIONS,
  patchRepeatSettings,
} from './repeatSettingsConfig';
import { countRepeatDates } from './scheduleUtils';

export type { RepeatSettingsValue } from './repeatSettingsConfig';
export {
  DEFAULT_REPEAT_SETTINGS,
  patchRepeatSettings,
} from './repeatSettingsConfig';

/** @deprecated Используйте RepeatSettingsValue */
export type RepeatCount = 4 | 8 | 12;

type Props = {
  value: RepeatSettingsValue;
  onChange: (value: RepeatSettingsValue) => void;
  /** Для превью числа дат в серии */
  dateIso?: string;
};

const KIND_ICONS: Record<RepeatKind, typeof HiCalendarDays> = {
  none: HiCalendarDays,
  weekly: HiArrowPath,
  biweekly: HiArrowPath,
  weekdays: HiBriefcase,
  pick_weekdays: HiSquares2X2,
};

function KindCard({
  selected,
  label,
  description,
  onClick,
  icon: Icon,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
  icon: typeof HiCalendarDays;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.99] ${
        selected
          ? 'border-[#F9A8B4] bg-gradient-to-br from-[#FFF9FB] to-white shadow-[0_8px_24px_rgba(255,95,122,0.12)] ring-2 ring-[#FFF1F4]'
          : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FFFBFC]'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          selected
            ? 'bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_8px_20px_rgba(255,95,122,0.28)]'
            : 'bg-[#f6f7fb] text-[#9CA3AF]'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-black text-[#111827]">{label}</span>
          {selected ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5f7a] text-white">
              <HiCheck className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[12px] font-semibold leading-relaxed text-[#6B7280]">
          {description}
        </span>
      </span>
    </button>
  );
}

function CountSelect({
  label,
  hint,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div>
      <p className="text-[13px] font-bold text-[#111827]">{label}</p>
      {hint ? <p className="mt-0.5 text-[12px] font-semibold text-[#9CA3AF]">{hint}</p> : null}
      <SlottySelect
        className="mt-2 w-full"
        tone="admin"
        value={value}
        onChange={onChange}
        options={options}
        aria-label={ariaLabel}
        sheetTitle={label}
        sheetSubtitle={hint}
      />
    </div>
  );
}

export function RepeatSettings({ value, onChange, dateIso = '' }: Props) {
  const dateCount = useMemo(
    () => (dateIso.trim() ? countRepeatDates(dateIso, value) : 0),
    [dateIso, value],
  );

  const summary = formatRepeatSummary(value, dateCount > 0 ? dateCount : undefined);
  const seriesMode = value.kind !== 'none';

  const setKind = (kind: RepeatKind) => {
    onChange(patchRepeatSettings(value, { kind }));
  };

  const toggleWeekday = (index: number) => {
    const next = [...value.pickWeekdayMask] as RepeatSettingsValue['pickWeekdayMask'];
    next[index] = !next[index];
    onChange(patchRepeatSettings(value, { pickWeekdayMask: next }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {REPEAT_KIND_OPTIONS.map((opt) => {
          const Icon = KIND_ICONS[opt.value];
          return (
            <KindCard
              key={opt.value}
              selected={value.kind === opt.value}
              label={opt.label}
              description={opt.description}
              icon={Icon}
              onClick={() => setKind(opt.value)}
            />
          );
        })}
      </div>

      {seriesMode ? (
        <div className="space-y-4 rounded-[20px] border border-[#FDE8ED] bg-[#f6f7fb] p-4">
          {value.kind === 'weekly' ? (
            <CountSelect
              label="Сколько недель"
              hint="Столько же окон, сколько недель в серии"
              value={String(value.weeklyCount)}
              options={WEEKLY_COUNT_OPTIONS.map((o) => ({
                value: String(o.value),
                label: o.label,
              }))}
              onChange={(v) =>
                onChange(
                  patchRepeatSettings(value, {
                    weeklyCount: Number(v) as (typeof value)['weeklyCount'],
                  }),
                )
              }
              ariaLabel="Сколько недель повторять"
            />
          ) : null}

          {value.kind === 'biweekly' ? (
            <CountSelect
              label="Сколько повторов"
              hint="Каждые 14 дней от выбранной даты"
              value={String(value.biweeklyCount)}
              options={BIWEEKLY_COUNT_OPTIONS.map((o) => ({
                value: String(o.value),
                label: o.label,
              }))}
              onChange={(v) =>
                onChange(
                  patchRepeatSettings(value, {
                    biweeklyCount: Number(v) as (typeof value)['biweeklyCount'],
                  }),
                )
              }
              ariaLabel="Сколько раз повторять раз в две недели"
            />
          ) : null}

          {value.kind === 'weekdays' ? (
            <CountSelect
              label="Период"
              hint="Все будни (пн–пт) внутри этого интервала"
              value={String(value.weekdaySpanWeeks)}
              options={WEEKDAY_SPAN_OPTIONS.map((o) => ({
                value: String(o.value),
                label: o.label,
              }))}
              onChange={(v) =>
                onChange(
                  patchRepeatSettings(value, {
                    weekdaySpanWeeks: Number(v) as (typeof value)['weekdaySpanWeeks'],
                  }),
                )
              }
              ariaLabel="Период для будних дней"
            />
          ) : null}

          {value.kind === 'pick_weekdays' ? (
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-bold text-[#111827]">Дни недели</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#9CA3AF]">
                  Отметьте, в какие дни создавать окна
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {WEEKDAY_SHORT.map((label, idx) => {
                    const on = value.pickWeekdayMask[idx];
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleWeekday(idx)}
                        className={`min-h-[2.75rem] min-w-[2.75rem] rounded-[14px] px-3 text-[14px] font-bold transition active:scale-[0.97] ${
                          on
                            ? 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_18px_rgba(255,95,122,0.28)]'
                            : 'border border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#ff5f7a]'
                        }`}
                        aria-pressed={on}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {!value.pickWeekdayMask.some(Boolean) ? (
                  <p className="mt-2 text-[12px] font-semibold text-[#DC2626]">
                    Выберите хотя бы один день
                  </p>
                ) : null}
              </div>

              <CountSelect
                label="На сколько недель"
                hint="Серия строится вперёд от выбранной даты"
                value={String(value.pickWeekdaysSpanWeeks)}
                options={PICK_WEEKDAYS_SPAN_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onChange={(v) =>
                  onChange(
                    patchRepeatSettings(value, {
                      pickWeekdaysSpanWeeks: Number(v) as (typeof value)['pickWeekdaysSpanWeeks'],
                    }),
                  )
                }
                ariaLabel="Период для выбранных дней"
              />

              <button
                type="button"
                className="text-[13px] font-bold text-[#ff5f7a]"
                onClick={() =>
                  onChange(patchRepeatSettings(value, { pickWeekdayMask: [...DEFAULT_WEEKDAY_MASK] }))
                }
              >
                Сбросить на будни (пн–пт)
              </button>
            </div>
          ) : null}

          <p className="text-[12px] font-semibold leading-relaxed text-[#6B7280]">
            Пересечения с уже существующими слотами будут пропущены автоматически.
          </p>
        </div>
      ) : null}

      <div
        className={`rounded-[16px] px-4 py-3 ${
          seriesMode && dateCount > 0
            ? 'bg-[#FFF1F4] ring-1 ring-[#FDE8ED]'
            : 'bg-white ring-1 ring-[#EAECEF]'
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Итого по повтору</p>
        <p
          className={`mt-1 text-[14px] font-bold leading-snug ${
            seriesMode && dateCount > 0 ? 'text-[#ff5f7a]' : 'text-[#374151]'
          }`}
        >
          {summary}
        </p>
      </div>
    </div>
  );
}
