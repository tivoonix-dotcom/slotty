import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import type { ScheduleSlotsStatusFilter } from './scheduleTypes';
import { scheduleChipClass, scheduleSheetPrimaryBtn, scheduleSheetSecondaryBtn } from './adminScheduleTheme';

export type ScheduleSlotsFilters = {
  status: ScheduleSlotsStatusFilter;
  dayIso: string;
  onlyUpcoming: boolean;
};

export const DEFAULT_SLOTS_FILTERS: ScheduleSlotsFilters = {
  status: 'all',
  dayIso: '',
  onlyUpcoming: false,
};

type Props = {
  open: boolean;
  onClose: () => void;
  filters: ScheduleSlotsFilters;
  onChange: (next: ScheduleSlotsFilters) => void;
  onReset: () => void;
  resultCount: number;
};

const STATUS_OPTIONS: Array<{
  value: ScheduleSlotsStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Свободные' },
  { value: 'booked', label: 'С записью' },
  { value: 'blocked', label: 'Закрытые' },
];

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ScheduleSlotsFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  resultCount,
}: Props) {
  const hasActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  return (
    <AdminBottomSheet variant="catalog" open={open} onClose={onClose} title="Фильтр окон">
      <div className="space-y-4">
        <AdminFormSheetSection title="Статус" variant="catalog">
          <div className="grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const selected = filters.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, status: opt.value })}
                  className={`min-h-11 ${scheduleChipClass(selected)}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </AdminFormSheetSection>

        <AdminFormSheetSection title="День" variant="catalog">
          {filters.dayIso ? (
            <div className="space-y-2">
              <SlottyDatePicker
                className="w-full"
                tone="admin"
                value={filters.dayIso}
                onChange={(v) => onChange({ ...filters, dayIso: v })}
                sheetTitle="День"
              />
              <button
                type="button"
                className="text-[13px] font-semibold text-[#111827] underline decoration-[#D1D5DB] underline-offset-2"
                onClick={() => onChange({ ...filters, dayIso: '' })}
              >
                Показать все дни
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={scheduleSheetSecondaryBtn}
              onClick={() => onChange({ ...filters, dayIso: todayIso() })}
            >
              Выбрать конкретный день
            </button>
          )}
        </AdminFormSheetSection>

        <AdminFormSheetSection title="Время" variant="catalog">
          <button
            type="button"
            onClick={() => onChange({ ...filters, onlyUpcoming: !filters.onlyUpcoming })}
            className={`flex w-full items-center justify-between gap-3 rounded-[10px] px-4 py-3.5 text-left transition active:scale-[0.99] ${
              filters.onlyUpcoming
                ? 'bg-[#3B4CCA] text-white'
                : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
            }`}
          >
            <span>
              <span className="block text-[14px] font-semibold">Только предстоящие</span>
              <span
                className={`mt-0.5 block text-[12px] font-medium ${
                  filters.onlyUpcoming ? 'text-white/85' : 'text-[#6B7280]'
                }`}
              >
                Скрыть прошедшие окна
              </span>
            </span>
            {filters.onlyUpcoming ? (
              <HiCheck className="h-5 w-5 shrink-0" aria-hidden />
            ) : null}
          </button>
        </AdminFormSheetSection>

        <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-center text-[13px] font-medium text-[#6B7280]">
          Найдено: <span className="font-semibold text-[#111827]">{resultCount}</span>
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button type="button" className={scheduleSheetPrimaryBtn} onClick={onClose}>
            Показать {resultCount > 0 ? `(${resultCount})` : ''}
          </button>
          {hasActive ? (
            <button
              type="button"
              className={scheduleSheetSecondaryBtn}
              onClick={() => {
                onReset();
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
