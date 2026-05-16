import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import type { ScheduleSlotsStatusFilter } from './scheduleTypes';
import {
  labelClass,
  primaryBtnClass,
  scheduleChipActive,
  secondaryBtnClass,
} from './scheduleUi';

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
};

const STATUS_OPTIONS: Array<{
  value: ScheduleSlotsStatusFilter;
  label: string;
  hint: string;
}> = [
  { value: 'all', label: 'Все окна', hint: 'Любой статус' },
  { value: 'free', label: 'Свободные', hint: 'Можно записать клиента' },
  { value: 'booked', label: 'С записью', hint: 'Уже занято' },
  { value: 'blocked', label: 'Недоступные', hint: 'Закрыто для записи' },
];

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ScheduleSlotsFiltersSheet({ open, onClose, filters, onChange, onReset }: Props) {
  const hasActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Фильтр окон">
      <div className="space-y-5">
        <div>
          <p className={labelClass}>Статус</p>
          <div className="mt-2 space-y-2">
            {STATUS_OPTIONS.map((opt) => {
              const selected = filters.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, status: opt.value })}
                  className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
                    selected
                      ? scheduleChipActive
                      : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-[#111827]">{opt.label}</span>
                    <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">{opt.hint}</span>
                  </span>
                  {selected ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E29595] text-white">
                      <HiCheck className="h-5 w-5" aria-hidden />
                    </span>
                  ) : (
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={labelClass}>День</p>
          {filters.dayIso ? (
            <div className="mt-2 space-y-2">
              <SlottyDatePicker
                className="w-full"
                value={filters.dayIso}
                onChange={(v) => onChange({ ...filters, dayIso: v })}
              />
              <button
                type="button"
                className="text-[13px] font-semibold text-[#C97B7B]"
                onClick={() => onChange({ ...filters, dayIso: '' })}
              >
                Показать все дни
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`${secondaryBtnClass} mt-2`}
              onClick={() => onChange({ ...filters, dayIso: todayIso() })}
            >
              Выбрать день
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...filters, onlyUpcoming: !filters.onlyUpcoming })}
          className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
            filters.onlyUpcoming
              ? scheduleChipActive
              : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-[#111827]">Только предстоящие</span>
            <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">
              Скрыть прошедшие окна
            </span>
          </span>
          {filters.onlyUpcoming ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E29595] text-white">
              <HiCheck className="h-5 w-5" aria-hidden />
            </span>
          ) : (
            <span className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]" aria-hidden />
          )}
        </button>

        <div className="flex flex-col gap-2 border-t border-[#F3F4F6] pt-4">
          <button type="button" className={primaryBtnClass} onClick={onClose}>
            Готово
          </button>
          {hasActive ? (
            <button
              type="button"
              className="text-[14px] font-semibold text-[#C97B7B]"
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
