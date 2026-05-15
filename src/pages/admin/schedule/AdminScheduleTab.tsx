import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  MasterDraft,
  MasterOnboardingService,
  MasterSchedule,
} from '../../../features/profile/lib/demoMasterStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { AdminMasterRealSlotsPanel } from './AdminMasterRealSlotsPanel';
import { SCHEDULE_TIME_SELECT_OPTIONS } from './scheduleTimeSelectOptions';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useAdminMasterDraft } from '../useAdminMasterData';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const BOOKING_HORIZON_DAYS = 365;
/** В черновике поле сохраняется для совместимости; перерыв после записи не используется. */
const SCHEDULE_GAP_MINUTES = 0;

type ScheduleWindow = {
  id: string;
  startTime: string;
  endTime: string;
};

type DateSlotDay = {
  date: string; // YYYY-MM-DD
  windows: ScheduleWindow[];
};

type DateSlotRule = {
  serviceId: string | 'all';
  days: DateSlotDay[];
  gapMinutes: number;
  bookingHorizonDays: number;
};

type ScheduleWithDateSlots = MasterSchedule & {
  dateSlotRules?: DateSlotRule[];
};

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function newId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function timeToMinutes(time: string): number {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;

  return hours * 60 + minutes;
}

function createWindow(startTime = '10:00', endTime = '18:00'): ScheduleWindow {
  return {
    id: newId('window'),
    startTime,
    endTime,
  };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return startOfMonth(next);
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMonthTitle(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

function formatDateLong(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date),
  );
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function getScheduleRules(schedule: MasterSchedule): DateSlotRule[] {
  const nextSchedule = schedule as ScheduleWithDateSlots;
  return Array.isArray(nextSchedule.dateSlotRules) ? nextSchedule.dateSlotRules : [];
}

function getRule(schedule: MasterSchedule, serviceId: string | 'all'): DateSlotRule {
  const rules = getScheduleRules(schedule);
  const exact = rules.find((rule) => rule.serviceId === serviceId);

  if (exact) {
    return {
      ...exact,
      gapMinutes: SCHEDULE_GAP_MINUTES,
      days: exact.days.map((day) => ({
        ...day,
        windows: day.windows.map((window) => ({ ...window })),
      })),
    };
  }

  const allRule = rules.find((rule) => rule.serviceId === 'all');

  if (allRule && serviceId !== 'all') {
    return {
      serviceId,
      gapMinutes: SCHEDULE_GAP_MINUTES,
      bookingHorizonDays: allRule.bookingHorizonDays,
      days: allRule.days.map((day) => ({
        ...day,
        windows: day.windows.map((window) => ({ ...window, id: newId('window') })),
      })),
    };
  }

  return {
    serviceId,
    days: [],
    gapMinutes: SCHEDULE_GAP_MINUTES,
    bookingHorizonDays: BOOKING_HORIZON_DAYS,
  };
}

function upsertRule(schedule: MasterSchedule, rule: DateSlotRule): MasterSchedule {
  const rules = getScheduleRules(schedule);
  const exists = rules.some((item) => item.serviceId === rule.serviceId);

  const nextRules = exists
    ? rules.map((item) => (item.serviceId === rule.serviceId ? rule : item))
    : [...rules, rule];

  const firstDay = rule.days.find((day) => day.windows.length > 0);
  const firstWindow = firstDay?.windows[0];

  const workDays = Array.from(
    new Set(rule.days.filter((day) => day.windows.length > 0).map((day) => getWeekdayIndex(parseIsoDate(day.date)))),
  ).sort((a, b) => a - b);

  return {
    ...schedule,
    workDays: workDays.length > 0 ? workDays : schedule.workDays,
    startTime: firstWindow?.startTime ?? schedule.startTime,
    endTime: firstWindow?.endTime ?? schedule.endTime,
    gapMinutes: rule.gapMinutes,
    dateSlotRules: nextRules,
  } as ScheduleWithDateSlots;
}

function validateWindows(windows: ScheduleWindow[]): string | null {
  const sorted = [...windows].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  for (const window of sorted) {
    if (timeToMinutes(window.endTime) <= timeToMinutes(window.startTime)) {
      return 'Время окончания должно быть позже начала.';
    }
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    if (!previous || !current) continue;

    if (timeToMinutes(current.startTime) < timeToMinutes(previous.endTime)) {
      return 'Окошки времени не должны пересекаться.';
    }
  }

  return null;
}

function getDayWindows(rule: DateSlotRule, date: string): ScheduleWindow[] {
  return rule.days.find((day) => day.date === date)?.windows ?? [];
}

function getServiceName(service: MasterOnboardingService | undefined): string {
  return service?.title ?? 'Все услуги';
}

function serviceIsActive(service: MasterOnboardingService): boolean {
  return (service as { isActive?: boolean }).isActive !== false;
}

function getVisibleServices(services: MasterOnboardingService[]): MasterOnboardingService[] {
  return services.filter(serviceIsActive);
}

function getNearestSlot(rule: DateSlotRule): { date: string; time: string } | null {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, BOOKING_HORIZON_DAYS);

  const days = [...rule.days]
    .filter((day) => day.windows.length > 0)
    .filter((day) => {
      const date = parseIsoDate(day.date);
      return date >= today && date <= maxDate;
    })
    .sort((a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime());

  for (const day of days) {
    const sortedWindows = [...day.windows].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const firstWindow = sortedWindows[0];

    if (firstWindow) {
      return {
        date: day.date,
        time: firstWindow.startTime,
      };
    }
  }

  return null;
}

function getMonthCells(monthDate: Date) {
  const firstDate = startOfMonth(monthDate);
  const daysInMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();
  const leadingCells = (firstDate.getDay() + 6) % 7;
  const cells: Array<Date | null> = Array.from({ length: leadingCells }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(firstDate.getFullYear(), firstDate.getMonth(), day));
  }

  return cells;
}

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
      <p className="text-[22px] font-semibold leading-none tracking-[-0.055em] text-neutral-950">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-snug text-neutral-500">
        {label}
      </p>
    </div>
  );
}

export function AdminScheduleTab({ draft, onPersist }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { flushScheduleToBackend } = useAdminMasterDraft();
  const services = draft.services;
  const visibleServices = getVisibleServices(services);

  const [selectedServiceId, setSelectedServiceId] = useState<string | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const [rule, setRule] = useState<DateSlotRule>(() => getRule(draft.schedule, 'all'));
  const [windows, setWindows] = useState<ScheduleWindow[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const serviceOptions = useMemo(
    () => [
      { value: 'all', label: 'Все услуги' },
      ...services.map((service) => ({
        value: service.id,
        label: service.title,
      })),
    ],
    [services],
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services],
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, BOOKING_HORIZON_DAYS), [today]);
  const selectedDateObject = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);

  const monthCells = useMemo(() => getMonthCells(monthCursor), [monthCursor]);

  const nearestSlot = useMemo(() => getNearestSlot(rule), [rule]);

  const savedDaysCount = useMemo(
    () => rule.days.filter((day) => day.windows.length > 0).length,
    [rule.days],
  );

  const savedWindowsCount = useMemo(
    () => rule.days.reduce((sum, day) => sum + day.windows.length, 0),
    [rule.days],
  );

  useEffect(() => {
    if (selectedServiceId !== 'all' && !services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId('all');
      return;
    }

    const nextRule = getRule(draft.schedule, selectedServiceId);
    const nextWindows = getDayWindows(nextRule, selectedDate);

    setRule(nextRule);
    setWindows(nextWindows.map((window) => ({ ...window })));
    setError(null);
  }, [draft.schedule, selectedDate, selectedServiceId, services]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const loadDate = useCallback(
    (date: string) => {
      const nextWindows = getDayWindows(rule, date);

      setSelectedDate(date);
      setWindows(nextWindows.map((window) => ({ ...window })));
      setError(null);
    },
    [rule],
  );

  const addWindow = useCallback(() => {
    setWindows((prev) => [...prev, createWindow()]);
    setError(null);
  }, []);

  const updateWindow = useCallback((windowId: string, patch: Partial<ScheduleWindow>) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === windowId ? { ...window, ...patch } : window)),
    );
    setError(null);
  }, []);

  const removeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((window) => window.id !== windowId));
    setError(null);
  }, []);

  const clearDay = useCallback(() => {
    setWindows([]);
    setError(null);
  }, []);

  const saveSelectedDay = useCallback(async () => {
    const validationError = validateWindows(windows);

    if (validationError) {
      setError(validationError);
      return;
    }

    const preparedWindows = [...windows]
      .map((window) => ({
        ...window,
        id: window.id || newId('window'),
      }))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const nextDaysWithoutCurrent = rule.days.filter((day) => day.date !== selectedDate);

    const nextDays =
      preparedWindows.length > 0
        ? [...nextDaysWithoutCurrent, { date: selectedDate, windows: preparedWindows }]
        : nextDaysWithoutCurrent;

    const nextRule: DateSlotRule = {
      ...rule,
      serviceId: selectedServiceId,
      gapMinutes: SCHEDULE_GAP_MINUTES,
      bookingHorizonDays: BOOKING_HORIZON_DAYS,
      days: nextDays.sort((a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime()),
    };

    const nextSchedule = upsertRule(draft.schedule, nextRule);

    const nextDraft = {
      ...draft,
      schedule: nextSchedule as MasterSchedule,
    };

    if (!useCabinetApi) {
      onPersist(nextDraft);
      setRule(nextRule);
      setError(null);
      showToast(preparedWindows.length > 0 ? 'Окошки сохранены' : 'День закрыт');
      return;
    }

    setError(null);
    try {
      await flushScheduleToBackend(nextDraft);
      setRule(nextRule);
      showToast(preparedWindows.length > 0 ? 'Окошки сохранены' : 'День закрыт');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  }, [
    draft,
    flushScheduleToBackend,
    onPersist,
    rule,
    selectedDate,
    selectedServiceId,
    showToast,
    useCabinetApi,
    windows,
  ]);

  if (services.length === 0) {
    return (
      <NothingFoundCard
        title="Сначала добавьте услугу"
        text="После добавления услуги вы сможете выбрать день в календаре и проставить свободные окошки."
      />
    );
  }

  return (
    <div className="space-y-4">
      <AdminMasterRealSlotsPanel services={services} />

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            График работы
          </p>

          <h2 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
            Шаблон по календарю
          </h2>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatCard value={savedDaysCount} label="дней открыто" />
            <StatCard value={savedWindowsCount} label="окошек" />
            <StatCard value={BOOKING_HORIZON_DAYS} label="дней вперед" />
          </div>

          <div className="mt-5 rounded-[26px] bg-[#F1EFEF] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Ближайшее время
            </p>

            <p className="mt-1 text-[17px] font-semibold text-neutral-950">
              {nearestSlot
                ? `${formatDateShort(parseIsoDate(nearestSlot.date))}, ${nearestSlot.time}`
                : 'Пока нет свободных окошек'}
            </p>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="rounded-full bg-[#EAFBF2] px-5 py-3 text-center text-[14px] font-semibold text-[#2F8A5B] shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          {toast}
        </div>
      ) : null}

      {visibleServices.length === 0 ? (
        <NothingFoundCard
          title="Нет видимых услуг"
          text="Покажите хотя бы одну услугу клиентам, чтобы настроить запись."
        />
      ) : null}

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-4">
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">
              Услуга
            </span>

            <SlottySelect
              className="mt-2 w-full"
              value={selectedServiceId}
              onChange={(value) => setSelectedServiceId(value)}
              options={serviceOptions}
            />
          </label>
        </div>
      </section>

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
              disabled={monthCursor <= startOfMonth(today)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-800 transition active:scale-[0.96] disabled:opacity-30"
              aria-label="Предыдущий месяц"
            >
              <IconChevronLeft />
            </button>

            <div className="text-center">
              <p className="text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
                {formatMonthTitle(monthCursor)}
              </p>

              <p className="mt-0.5 text-[12px] font-medium text-neutral-400">
                выберите день
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              disabled={addMonths(monthCursor, 1) > startOfMonth(maxDate)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-800 transition active:scale-[0.96] disabled:opacity-30"
              aria-label="Следующий месяц"
            >
              <IconChevronRight />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            {WEEKDAY_LABELS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {monthCells.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const iso = toIsoDate(date);
              const isPast = date < today;
              const isTooFar = date > maxDate;
              const disabled = isPast || isTooFar;
              const selected = iso === selectedDate;
              const savedWindows = getDayWindows(rule, iso);
              const hasWindows = savedWindows.length > 0;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => loadDate(iso)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-[18px] transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-25 ${
                    selected
                      ? 'bg-[#E29595] text-white shadow-[0_10px_28px_rgba(226,149,149,0.24)]'
                      : hasWindows
                        ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                        : 'bg-[#F1EFEF] text-neutral-900'
                  }`}
                >
                  <span className="text-[15px] font-semibold leading-none">
                    {date.getDate()}
                  </span>

                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                      hasWindows ? (selected ? 'bg-white' : 'bg-[#E29595]') : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Выбранный день
              </p>

              <h3 className="mt-1 text-[25px] font-semibold leading-tight tracking-[-0.06em] text-neutral-950">
                {formatDateLong(selectedDateObject)}
              </h3>

              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                {getServiceName(selectedService)}
              </p>
            </div>

            <button
              type="button"
              onClick={clearDay}
              className="shrink-0 rounded-full bg-[#F1EFEF] px-4 py-2.5 text-[13px] font-semibold text-neutral-500 transition active:scale-[0.98]"
            >
              Закрыть день
            </button>
          </div>

          {windows.length === 0 ? (
            <NothingFoundCard
              className="mt-5"
              title="Окошек пока нет"
              text="Добавьте время, когда клиент сможет записаться в этот день."
            />
          ) : (
            <div className="mt-5 space-y-3">
              {windows.map((window, index) => (
                <div
                  key={window.id}
                  className="rounded-[28px] bg-[#F1EFEF] p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-neutral-950">
                      Окошко {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeWindow(window.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-500 shadow-[0_6px_18px_rgba(17,17,17,0.05)] transition active:scale-[0.96]"
                      aria-label="Удалить окошко"
                    >
                      <IconClose />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className="text-[12px] font-medium text-neutral-400">
                        С
                      </span>

                      <SlottySelect
                        className="mt-1 w-full"
                        value={window.startTime}
                        onChange={(value) => updateWindow(window.id, { startTime: value })}
                        options={SCHEDULE_TIME_SELECT_OPTIONS}
                      />
                    </label>

                    <label>
                      <span className="text-[12px] font-medium text-neutral-400">
                        По
                      </span>

                      <SlottySelect
                        className="mt-1 w-full"
                        value={window.endTime}
                        onChange={(value) => updateWindow(window.id, { endTime: value })}
                        options={SCHEDULE_TIME_SELECT_OPTIONS}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addWindow}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            <IconPlus className="h-4 w-4" />
            Добавить окошко
          </button>

          {error ? (
            <p className="mt-4 rounded-[24px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void saveSelectedDay()}
            className="mt-4 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Сохранить день
          </button>
        </div>
      </section>

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Как увидит клиент
          </p>

          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.055em] text-neutral-950">
            {getServiceName(selectedService)}
          </h3>

          <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
            На выбранный день клиент увидит только сохраненные окошки.
          </p>

          {windows.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {windows
                .slice()
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                .map((window) => (
                  <span
                    key={window.id}
                    className="rounded-full bg-[#F1EFEF] px-4 py-2 text-[13px] font-semibold text-neutral-800"
                  >
                    {window.startTime}–{window.endTime}
                  </span>
                ))}
            </div>
          ) : (
            <p className="mt-4 rounded-[24px] bg-[#F1EFEF] px-4 py-4 text-[14px] leading-relaxed text-neutral-500">
              В этот день запись закрыта.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}