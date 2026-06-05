import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendarDays, HiCheck, HiChevronLeft, HiChevronRight, HiClock } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetSection, AdminFormSheetStepper } from '../shared/AdminFormSheetLayout';
import { scheduleSheetPrimaryBtn, scheduleSheetSecondaryBtn } from './adminScheduleTheme';
import { formatDdMmYyyy } from '../overview/overviewFormat';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';
import {
  addDaysIso,
  filterNonOverlappingBatch,
  planBatchSlots,
  todayIsoLocal,
  type BatchScheduleConfig,
  type BatchWeekday,
} from './scheduleBatchPlan';
import { createMySlotsBatch, type BatchCreateSlotsResult } from '../../../features/admin/api/adminSlotsApi';
import { formatDurationRu } from './scheduleUtils';
import { WEEKDAY_LABELS_SHORT } from '../../../features/master/model/masterDraftStorage';
import { notifyMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import {
  batchSkipReasonLabel,
  formatBatchSuccessSummary,
  summarizeBatchSkipped,
} from './batchSkipReasonLabels';

type ServiceOption = { id: string; title: string; durationMin: number };

type Props = {
  open: boolean;
  onClose: () => void;
  masterId: string | null | undefined;
  services: ServiceOption[];
  defaultWorkDays: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  scheduleHorizonDays: number | null;
  existingSlots: Array<{ startsAt: string; endsAt: string }>;
  onCreated: () => void;
  initialPeriodDays?: 7 | 14 | 30;
  initialServiceId?: string | null;
  useCabinetApi?: boolean;
};

type Step = 0 | 1 | 2 | 3;

const WIZARD_STEPS = ['Период', 'Время', 'Проверка'] as const;

const PERIOD_OPTIONS: Array<{
  days: 7 | 14 | 30;
  label: string;
  hint: string;
}> = [
  { days: 7, label: 'Неделя', hint: 'Быстрый старт — 7 рабочих дней' },
  { days: 14, label: '2 недели', hint: 'Оптимально для Free-тарифа' },
  { days: 30, label: 'Месяц', hint: 'Настроить и ждать клиентов' },
];

const STEP_SUBTITLES: Record<Step, string> = {
  0: 'Выберите период и рабочие дни — окна появятся только в эти дни.',
  1: 'Укажите часы приёма и длительность одного окна для записи.',
  2: 'Проверьте итог: сколько окон будет создано и для каких услуг.',
  3: '',
};

function dayChipClass(on: boolean): string {
  return `flex min-h-11 min-w-[2.75rem] items-center justify-center rounded-[12px] px-2 text-[14px] font-semibold transition active:scale-[0.98] ${
    on ? 'bg-[#3B4CCA] text-white shadow-sm' : 'bg-[#f6f7fb] text-[#374151] hover:bg-[#EEF0F4]'
  }`;
}

function periodCardClass(selected: boolean): string {
  return `flex w-full flex-col rounded-[16px] p-4 text-left transition active:scale-[0.99] ${
    selected
      ? 'bg-[#EEF0FC] ring-2 ring-[#3B4CCA] ring-offset-0'
      : 'bg-[#f6f7fb] hover:bg-[#EEF0F4]'
  }`;
}

function WizardLivePreview({
  periodDays,
  startDateIso,
  endDateIso,
  weekdays,
  dayStartTime,
  dayEndTime,
  slotDurationMinutes,
  toCreate,
  skippedOverlap,
}: {
  periodDays: number;
  startDateIso: string;
  endDateIso: string;
  weekdays: BatchWeekday[];
  dayStartTime: string;
  dayEndTime: string;
  slotDurationMinutes: number;
  toCreate: number;
  skippedOverlap: number;
}) {
  const dayLabels =
    weekdays.length > 0
      ? weekdays.map((d) => WEEKDAY_LABELS_SHORT[d]).join(', ')
      : 'не выбраны';

  return (
    <div className="rounded-[16px] bg-[#f6f7fb] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Предпросмотр</p>
      <p className="mt-2 text-[22px] font-black tabular-nums tracking-[-0.04em] text-[#111827]">
        {toCreate > 0 ? toCreate : '—'}{' '}
        <span className="text-[15px] font-bold text-[#6B7280]">
          {toCreate === 1 ? 'окно' : toCreate >= 2 && toCreate <= 4 ? 'окна' : 'окон'}
        </span>
      </p>
      <ul className="mt-3 space-y-1.5 text-[13px] font-medium text-[#374151]">
        <li className="flex gap-2">
          <HiCalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#3B4CCA]" aria-hidden />
          <span>
            {formatDdMmYyyy(startDateIso)} — {formatDdMmYyyy(endDateIso)} ({periodDays} дн.)
          </span>
        </li>
        <li className="flex gap-2">
          <span className="w-4 shrink-0 text-center text-[#3B4CCA]">•</span>
          <span>{dayLabels}</span>
        </li>
        <li className="flex gap-2">
          <HiClock className="mt-0.5 h-4 w-4 shrink-0 text-[#3B4CCA]" aria-hidden />
          <span>
            {dayStartTime}–{dayEndTime}, окно {formatDurationRu(slotDurationMinutes)}
          </span>
        </li>
      </ul>
      {skippedOverlap > 0 ? (
        <p className="mt-3 text-[12px] font-semibold text-[#B45309]">
          {skippedOverlap} пропустим — время уже занято
        </p>
      ) : null}
      {weekdays.length === 0 ? (
        <p className="mt-3 text-[12px] font-semibold text-[#DC2626]">Выберите хотя бы один рабочий день</p>
      ) : null}
    </div>
  );
}

export function CreateMonthScheduleWizard({
  open,
  onClose,
  masterId,
  services,
  defaultWorkDays,
  defaultStartTime,
  defaultEndTime,
  scheduleHorizonDays,
  existingSlots,
  onCreated,
  initialPeriodDays = 30,
  initialServiceId = null,
  useCabinetApi = true,
}: Props) {
  const [step, setStep] = useState<Step>(0);
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(initialPeriodDays);
  const [weekdays, setWeekdays] = useState<BatchWeekday[]>(() =>
    (defaultWorkDays.length ? defaultWorkDays : [0, 1, 2, 3, 4]) as BatchWeekday[],
  );
  const [dayStartTime, setDayStartTime] = useState(defaultStartTime || '10:00');
  const [dayEndTime, setDayEndTime] = useState(defaultEndTime || '19:00');
  const [breakStartTime, setBreakStartTime] = useState('14:00');
  const [breakEndTime, setBreakEndTime] = useState('15:00');
  const [useBreak, setUseBreak] = useState(false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [serviceScope, setServiceScope] = useState<'all' | 'one'>(() =>
    initialServiceId ? 'one' : 'all',
  );
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchCreateSlotsResult | null>(null);

  const maxPeriod = scheduleHorizonDays ?? 30;
  const effectivePeriod = Math.min(periodDays, maxPeriod) as 7 | 14 | 30;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setResult(null);
    setError(null);
    setPeriodDays(initialPeriodDays);
    if (initialServiceId) {
      setServiceScope('one');
      setServiceId(initialServiceId);
    }
  }, [open, initialPeriodDays, initialServiceId]);

  const startDateIso = todayIsoLocal();
  const endDateIso = addDaysIso(startDateIso, effectivePeriod - 1);

  const config = useMemo((): BatchScheduleConfig => {
    return {
      startDateIso,
      endDateIso,
      weekdays,
      dayStartTime,
      dayEndTime,
      breakStartTime: useBreak ? breakStartTime : null,
      breakEndTime: useBreak ? breakEndTime : null,
      slotDurationMinutes,
      serviceId: serviceScope === 'one' ? serviceId : null,
    };
  }, [
    breakEndTime,
    breakStartTime,
    dayEndTime,
    dayStartTime,
    endDateIso,
    serviceId,
    serviceScope,
    slotDurationMinutes,
    startDateIso,
    useBreak,
    weekdays,
  ]);

  const preview = useMemo(() => {
    const planned = planBatchSlots(config);
    const { toCreate, skippedOverlap } = filterNonOverlappingBatch(planned, existingSlots);
    return { total: planned.length, toCreate: toCreate.length, skippedOverlap, samples: toCreate.slice(0, 5) };
  }, [config, existingSlots]);

  const toggleWeekday = (day: BatchWeekday) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const resetAndClose = () => {
    setStep(0);
    setResult(null);
    setError(null);
    onClose();
  };

  const canProceed =
    step === 0
      ? weekdays.length > 0
      : step === 1
        ? dayStartTime < dayEndTime
        : step === 2
          ? preview.toCreate > 0 && (serviceScope === 'all' || Boolean(serviceId))
          : true;

  const submit = async () => {
    if (!useCabinetApi) {
      setError('Создание окон доступно только с подключённым кабинетом. Это не демо-режим записи.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createMySlotsBatch({
        startDate: config.startDateIso,
        endDate: config.endDateIso,
        weekdays: config.weekdays,
        dayStartTime: config.dayStartTime,
        dayEndTime: config.dayEndTime,
        breakStartTime: config.breakStartTime,
        breakEndTime: config.breakEndTime,
        slotDurationMinutes: config.slotDurationMinutes,
        serviceId: config.serviceId,
      });
      if (res.created <= 0) {
        const skippedHint = summarizeBatchSkipped(res);
        setError(
          skippedHint
            ? `Не удалось создать ни одного окна. ${skippedHint}.`
            : 'Не удалось создать окна. Проверьте настройки и попробуйте ещё раз.',
        );
        return;
      }
      setResult(res);
      setStep(3);
      notifyMasterSlotsChanged();
      onCreated();
    } catch {
      setError('Не удалось создать окна. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const footer =
    step === 3 ? (
      <div className="flex w-full flex-col gap-2">
        <Link
          to={`${ADMIN_SCHEDULE_PATH}?tab=calendar`}
          className={`${scheduleSheetPrimaryBtn} w-full text-center`}
        >
          Посмотреть календарь
        </Link>
        <MasterPublicPreviewLink masterId={masterId} ready className="w-full justify-center" variant="secondary" />
        <button type="button" onClick={resetAndClose} className={`${scheduleSheetSecondaryBtn} w-full`}>
          Ждать заявок
        </button>
      </div>
    ) : (
      <div className="flex w-full gap-2">
        {step > 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStep((s) => (s - 1) as Step)}
            className={`${scheduleSheetSecondaryBtn} min-h-11 min-w-[48px] px-3`}
            aria-label="Назад"
          >
            <HiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {step < 2 ? (
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className={`${scheduleSheetPrimaryBtn} min-h-11 flex-1`}
          >
            Далее
            <HiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !canProceed}
            onClick={() => void submit()}
            className={`${scheduleSheetPrimaryBtn} min-h-11 flex-1`}
          >
            {busy ? 'Создаём…' : `Создать ${preview.toCreate} окон`}
          </button>
        )}
      </div>
    );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={resetAndClose}
      title={step === 3 ? 'Готово' : 'Создать окна на период'}
      subtitle={step < 3 ? STEP_SUBTITLES[step] : undefined}
      headerAfter={
        step < 3 ? (
          <AdminFormSheetStepper step={step} steps={WIZARD_STEPS} variant="catalog" accent="schedule" />
        ) : null
      }
      footer={footer}
    >
      {error ? (
        <p className="mb-4 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[13px] font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}

      {step === 0 ? (
        <div className="space-y-5">
          <AdminFormSheetSection title="Период" variant="catalog">
            {scheduleHorizonDays != null && scheduleHorizonDays < 30 ? (
              <p className="mb-3 text-[13px] font-medium text-[#6B7280]">
                На вашем тарифе — до {scheduleHorizonDays} дней вперёд.
              </p>
            ) : null}
            <div className="space-y-2">
              {PERIOD_OPTIONS.filter((o) => o.days <= maxPeriod).map((opt) => {
                const endIso = addDaysIso(startDateIso, opt.days - 1);
                const selected = effectivePeriod === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setPeriodDays(opt.days)}
                    className={periodCardClass(selected)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-bold text-[#111827]">{opt.label}</p>
                        <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{opt.hint}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums ${
                          selected ? 'bg-[#3B4CCA] text-white' : 'bg-white text-[#374151]'
                        }`}
                      >
                        {opt.days} дн.
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">
                      {formatDdMmYyyy(startDateIso)} — {formatDdMmYyyy(endIso)}
                    </p>
                  </button>
                );
              })}
            </div>
          </AdminFormSheetSection>

          <AdminFormSheetSection title="Рабочие дни" variant="catalog">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={dayChipClass(weekdays.join(',') === '0,1,2,3,4')}
                onClick={() => setWeekdays([0, 1, 2, 3, 4])}
              >
                Пн–Пт
              </button>
              <button
                type="button"
                className={dayChipClass(weekdays.length === 7)}
                onClick={() => setWeekdays([0, 1, 2, 3, 4, 5, 6])}
              >
                Каждый день
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS_SHORT.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleWeekday(day as BatchWeekday)}
                  className={dayChipClass(weekdays.includes(day as BatchWeekday))}
                >
                  {label}
                </button>
              ))}
            </div>
          </AdminFormSheetSection>

          <WizardLivePreview
            periodDays={effectivePeriod}
            startDateIso={startDateIso}
            endDateIso={endDateIso}
            weekdays={weekdays}
            dayStartTime={dayStartTime}
            dayEndTime={dayEndTime}
            slotDurationMinutes={slotDurationMinutes}
            toCreate={preview.toCreate}
            skippedOverlap={preview.skippedOverlap}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          <AdminFormSheetSection title="Часы приёма" variant="catalog">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Начало дня</span>
                <input
                  type="time"
                  value={dayStartTime}
                  onChange={(e) => setDayStartTime(e.target.value)}
                  className="mt-1.5 w-full rounded-[12px] border-0 bg-[#f6f7fb] px-3 py-3.5 text-[16px] font-semibold text-[#111827]"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Конец дня</span>
                <input
                  type="time"
                  value={dayEndTime}
                  onChange={(e) => setDayEndTime(e.target.value)}
                  className="mt-1.5 w-full rounded-[12px] border-0 bg-[#f6f7fb] px-3 py-3.5 text-[16px] font-semibold text-[#111827]"
                />
              </label>
            </div>
            {dayStartTime >= dayEndTime ? (
              <p className="mt-2 text-[13px] font-semibold text-[#DC2626]">
                Конец должен быть позже начала
              </p>
            ) : null}
          </AdminFormSheetSection>

          <AdminFormSheetSection title="Перерыв" variant="catalog">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] bg-[#f6f7fb] px-4 py-3">
              <input
                type="checkbox"
                checked={useBreak}
                onChange={(e) => setUseBreak(e.target.checked)}
                className="h-5 w-5 rounded border-[#D1D5DB] text-[#3B4CCA]"
              />
              <span className="text-[14px] font-semibold text-[#374151]">Не создавать окна в перерыве</span>
            </label>
            {useBreak ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                  aria-label="Начало перерыва"
                  className="w-full rounded-[12px] border-0 bg-[#f6f7fb] px-3 py-3.5 text-[16px]"
                />
                <input
                  type="time"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                  aria-label="Конец перерыва"
                  className="w-full rounded-[12px] border-0 bg-[#f6f7fb] px-3 py-3.5 text-[16px]"
                />
              </div>
            ) : null}
          </AdminFormSheetSection>

          <AdminFormSheetSection title="Длительность окна" variant="catalog">
            <p className="mb-2 text-[13px] font-medium text-[#6B7280]">
              Клиент выбирает свободное окно; услуга должна помещаться по времени.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSlotDurationMinutes(m)}
                  className={dayChipClass(slotDurationMinutes === m)}
                >
                  {m}′
                </button>
              ))}
            </div>
          </AdminFormSheetSection>

          <WizardLivePreview
            periodDays={effectivePeriod}
            startDateIso={startDateIso}
            endDateIso={endDateIso}
            weekdays={weekdays}
            dayStartTime={dayStartTime}
            dayEndTime={dayEndTime}
            slotDurationMinutes={slotDurationMinutes}
            toCreate={preview.toCreate}
            skippedOverlap={preview.skippedOverlap}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <AdminFormSheetSection title="Услуги" variant="catalog">
            <div className="space-y-2">
              <button
                type="button"
                className={`${periodCardClass(serviceScope === 'all')} !p-3.5`}
                onClick={() => setServiceScope('all')}
              >
                <p className="text-[15px] font-bold text-[#111827]">Все активные услуги</p>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  Клиент выберет любую услугу, которая помещается по длительности.
                </p>
              </button>
              <button
                type="button"
                className={`${periodCardClass(serviceScope === 'one')} !p-3.5`}
                onClick={() => setServiceScope('one')}
              >
                <p className="text-[15px] font-bold text-[#111827]">Конкретная услуга</p>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  Окна только для одной позиции каталога.
                </p>
              </button>
            </div>
            {serviceScope === 'one' ? (
              <select
                value={serviceId ?? ''}
                onChange={(e) => setServiceId(e.target.value || null)}
                className="mt-3 w-full rounded-[12px] border-0 bg-[#f6f7fb] px-3 py-3.5 text-[15px] font-semibold text-[#111827]"
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {formatDurationRu(s.durationMin)}
                  </option>
                ))}
              </select>
            ) : null}
          </AdminFormSheetSection>

          <AdminFormSheetSection title="Итог" variant="catalog">
            <WizardLivePreview
              periodDays={effectivePeriod}
              startDateIso={startDateIso}
              endDateIso={endDateIso}
              weekdays={weekdays}
              dayStartTime={dayStartTime}
              dayEndTime={dayEndTime}
              slotDurationMinutes={slotDurationMinutes}
              toCreate={preview.toCreate}
              skippedOverlap={preview.skippedOverlap}
            />
            {preview.samples.length > 0 ? (
              <div className="mt-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  Ближайшие окна
                </p>
                <ul className="mt-2 space-y-1.5">
                  {preview.samples.map((slot) => (
                    <li
                      key={slot.startsAtIso}
                      className="flex items-center justify-between rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold text-[#374151]"
                    >
                      <span>{formatDdMmYyyy(slot.dateIso)}</span>
                      <span className="tabular-nums text-[#111827]">
                        {slot.startTime}–{slot.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </AdminFormSheetSection>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-4 py-2 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
            <HiCheck className="h-9 w-9" strokeWidth={2.5} aria-hidden />
          </span>
          <p className="text-[18px] font-black tracking-[-0.03em] text-[#111827]">
            Клиенты теперь могут выбрать время
          </p>
          <p className="text-[14px] font-semibold text-[#111827]">{formatBatchSuccessSummary(result)}</p>
          {result.skipped > 0 ? (
            <p className="text-[13px] font-medium text-[#6B7280]">{summarizeBatchSkipped(result)}</p>
          ) : null}
          {result.skippedReasons.length > 0 && result.skipped <= 8 ? (
            <ul className="mx-auto max-w-sm space-y-1 text-left text-[12px] font-medium text-[#6B7280]">
              {result.skippedReasons.slice(0, 8).map((row) => (
                <li key={`${row.date}-${row.time}-${row.reason}`}>
                  {row.date} {row.time} — {batchSkipReasonLabel(row.reason)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
