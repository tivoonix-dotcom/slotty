import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import {
  createMySlot,
  deleteMySlot,
  getMySlots,
  type MySlotDto,
} from '../../../features/admin/api/adminSlotsApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';

type RepeatKind = 'none' | 'weekly' | 'biweekly' | 'weekdays' | 'pick_weekdays';

type PlannedSlot = {
  dateIso: string;
  startTime: string;
  endTime: string;
  serviceId: string | null;
};

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildFiveMinuteTimes(): string[] {
  const out: string[] = [];
  for (let h = 6; h <= 23; h += 1) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 23 && m > 55) break;
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

const BASE_TIME_OPTIONS = buildFiveMinuteTimes().map((time) => ({ value: time, label: time }));

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function localDateTimeToUtcIso(dateIso: string, timeHm: string): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  const local = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return local.toISOString();
}

function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Пн=0 … Вс=6 */
function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangesOverlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function slotOverlapsList(startsMs: number, endsMs: number, list: MySlotDto[]): boolean {
  for (const s of list) {
    const a = new Date(s.startsAt).getTime();
    const b = new Date(s.endsAt).getTime();
    if (rangesOverlapMs(startsMs, endsMs, a, b)) return true;
  }
  return false;
}

function windowsCountRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} окон`;
  if (mod10 === 1) return `${n} окно`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} окна`;
  return `${n} окон`;
}

function serviceIsActive(service: { isActive?: boolean }): boolean {
  return service.isActive !== false;
}

function serviceTitleById(services: MasterOnboardingService[], id: string | null): string {
  if (!id) return 'Любая услуга';
  const s = services.find((x) => x.id === id);
  return s?.title ?? 'Услуга';
}

function formatSlotDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
}

function formatSlotTimeRange(s: MySlotDto): string {
  const a = new Date(s.startsAt);
  const b = new Date(s.endsAt);
  const ta = a.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const tb = b.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${ta}–${tb}`;
}

function formatClientPreviewLine(s: MySlotDto): string {
  const a = new Date(s.startsAt);
  const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(a);
  const timePart = `${pad2(a.getHours())}:${pad2(a.getMinutes())}`;
  return `${datePart}, ${timePart}`;
}

function formatHmFromDate(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatGroupHeader(d: Date, todayStart: Date): string {
  const ds = startOfLocalDay(d).getTime();
  const ts = todayStart.getTime();
  const dateStr = formatSlotDate(d);
  return ds === ts ? `Сегодня, ${dateStr}` : dateStr;
}

function makeDemoSlot(payload: {
  startsAt: string;
  endsAt: string;
  serviceId: string | null;
}): MySlotDto {
  const now = new Date().toISOString();
  return {
    id: newLocalId(),
    masterId: 'demo',
    serviceId: payload.serviceId,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    status: 'available',
    source: 'manual',
    createdAt: now,
  };
}

function expandRepeatDates(
  anchorIso: string,
  kind: RepeatKind,
  weeklyCount: 4 | 8 | 12,
  biweeklyCount: 4 | 6 | 8,
  weekdayWeeks: 1 | 2 | 4,
  pickWeekdaysWeeks: 2 | 4 | 8,
  weekdaysMask: boolean[],
): string[] {
  const anchor = startOfLocalDay(parseIsoDate(anchorIso));
  const out: string[] = [];

  const pushUnique = (iso: string) => {
    if (!out.includes(iso)) out.push(iso);
  };

  if (kind === 'none') {
    pushUnique(anchorIso);
    return out;
  }

  if (kind === 'weekly') {
    for (let i = 0; i < weeklyCount; i += 1) {
      pushUnique(toIsoDate(addDays(anchor, i * 7)));
    }
    return out;
  }

  if (kind === 'biweekly') {
    for (let i = 0; i < biweeklyCount; i += 1) {
      pushUnique(toIsoDate(addDays(anchor, i * 14)));
    }
    return out;
  }

  if (kind === 'weekdays') {
    const span = weekdayWeeks * 7;
    for (let d = 0; d < span; d += 1) {
      const day = addDays(anchor, d);
      if (getWeekdayIndex(day) <= 4) pushUnique(toIsoDate(day));
    }
    return out;
  }

  if (kind === 'pick_weekdays') {
    if (!weekdaysMask.some(Boolean)) return [];
    const span = pickWeekdaysWeeks * 7;
    for (let d = 0; d < span; d += 1) {
      const day = addDays(anchor, d);
      const wd = getWeekdayIndex(day);
      if (weekdaysMask[wd]) pushUnique(toIsoDate(day));
    }
    return out;
  }

  return [anchorIso];
}

export function AdminBookingWindowsTab({ draft, onPersist: _onPersist }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();

  const visibleServices = useMemo(() => draft.services.filter(serviceIsActive), [draft.services]);

  const [rows, setRows] = useState<MySlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [dateIso, setDateIso] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [serviceId, setServiceId] = useState('');

  const [repeatKind, setRepeatKind] = useState<RepeatKind>('none');
  const [weeklyRepeatWeeks, setWeeklyRepeatWeeks] = useState<4 | 8 | 12>(4);
  const [biweeklyRepeatTimes, setBiweeklyRepeatTimes] = useState<4 | 6 | 8>(4);
  const [weekdaySpanWeeks, setWeekdaySpanWeeks] = useState<1 | 2 | 4>(1);
  const [pickWeekdayMask, setPickWeekdayMask] = useState<boolean[]>(() => [true, true, true, true, true, false, false]);
  const [pickWeekdaysSpanWeeks, setPickWeekdaysSpanWeeks] = useState<2 | 4 | 8>(2);

  const [duplicateSlot, setDuplicateSlot] = useState<MySlotDto | null>(null);
  const [dupDateIso, setDupDateIso] = useState('');
  const [dupStart, setDupStart] = useState('10:00');
  const [dupEnd, setDupEnd] = useState('11:00');
  const [dupServiceId, setDupServiceId] = useState('');
  const [dupError, setDupError] = useState<string | null>(null);
  const [dupSaving, setDupSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearFutureStep, setClearFutureStep] = useState<0 | 1>(0);

  const reloadSlots = useCallback(async (): Promise<MySlotDto[]> => {
    const list = await getMySlots();
    setRows(list);
    return list;
  }, []);

  useEffect(() => {
    if (!useCabinetApi) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setFormError(null);
      try {
        const list = await getMySlots();
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) setFormError(e instanceof Error ? e.message : 'Не удалось загрузить окна');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...visibleServices
        .filter((s) => isUuid(s.id))
        .map((s) => ({ value: s.id, label: s.title })),
    ],
    [visibleServices],
  );

  const timeOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(...BASE_TIME_OPTIONS.map((o) => o.value), startTime, endTime),
    [endTime, startTime],
  );

  const dupTimeOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(...BASE_TIME_OPTIONS.map((o) => o.value), dupStart, dupEnd),
    [dupEnd, dupStart],
  );

  const repeatKindOptions = useMemo(
    () => [
      { value: 'none', label: 'Не повторять' },
      { value: 'weekly', label: 'Каждую неделю' },
      { value: 'biweekly', label: 'Каждые 2 недели' },
      { value: 'weekdays', label: 'Каждый будний день' },
      { value: 'pick_weekdays', label: 'Выбрать дни недели' },
    ],
    [],
  );

  const plannedSlots: PlannedSlot[] = useMemo(() => {
    const dates = expandRepeatDates(
      dateIso,
      repeatKind,
      weeklyRepeatWeeks,
      biweeklyRepeatTimes,
      weekdaySpanWeeks,
      pickWeekdaysSpanWeeks,
      pickWeekdayMask,
    );
    const sid = serviceId.trim() && isUuid(serviceId.trim()) ? serviceId.trim() : null;
    return dates.map((d) => ({
      dateIso: d,
      startTime,
      endTime,
      serviceId: sid,
    }));
  }, [
    biweeklyRepeatTimes,
    dateIso,
    endTime,
    pickWeekdayMask,
    pickWeekdaysSpanWeeks,
    repeatKind,
    serviceId,
    startTime,
    weekdaySpanWeeks,
    weeklyRepeatWeeks,
  ]);

  const plannedCreatableCount = useMemo(() => {
    const now = Date.now();
    let n = 0;
    for (const p of plannedSlots) {
      const startMs = new Date(localDateTimeToUtcIso(p.dateIso, p.startTime)).getTime();
      const endMs = new Date(localDateTimeToUtcIso(p.dateIso, p.endTime)).getTime();
      if (timeToMinutes(p.endTime) <= timeToMinutes(p.startTime)) return 0;
      if (endMs - startMs < 10 * 60 * 1000) continue;
      if (startMs <= now) continue;
      n += 1;
    }
    return n;
  }, [plannedSlots]);

  const validateService = useCallback(
    (sid: string | null): string | null => {
      if (sid && (!isUuid(sid) || !visibleServices.some((s) => s.id === sid))) {
        return 'Услуга недоступна или скрыта.';
      }
      return null;
    },
    [visibleServices],
  );

  const validatePlannedBase = useCallback((): string | null => {
    if (!dateIso.trim()) return 'Укажите дату.';
    if (!startTime.trim() || !endTime.trim()) return 'Укажите время начала и окончания.';
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return 'Время окончания должно быть позже времени начала.';
    }
    const startMs = new Date(localDateTimeToUtcIso(dateIso, startTime)).getTime();
    const endMs = new Date(localDateTimeToUtcIso(dateIso, endTime)).getTime();
    if (endMs - startMs < 10 * 60 * 1000) {
      return 'Минимальная длительность окна — 10 минут.';
    }
    if (startMs <= Date.now()) return 'Нельзя создать окно в прошлом.';
    return validateService(serviceId.trim() ? serviceId.trim() : null);
  }, [dateIso, endTime, serviceId, startTime, validateService]);

  const onAddWindows = useCallback(async () => {
    setFormError(null);
    const baseErr = validatePlannedBase();
    if (baseErr) {
      setFormError(baseErr);
      return;
    }

    if (plannedSlots.length === 0) {
      setFormError('Выберите хотя бы один день недели.');
      return;
    }

    const now = Date.now();
    const built: { startsAt: string; endsAt: string; serviceId: string | null }[] = [];
    for (const p of plannedSlots) {
      const startMs = new Date(localDateTimeToUtcIso(p.dateIso, p.startTime)).getTime();
      const endMs = new Date(localDateTimeToUtcIso(p.dateIso, p.endTime)).getTime();
      if (timeToMinutes(p.endTime) <= timeToMinutes(p.startTime)) continue;
      if (endMs - startMs < 10 * 60 * 1000) continue;
      if (startMs <= now) continue;
      const se = validateService(p.serviceId);
      if (se) {
        setFormError(se);
        return;
      }
      built.push({
        startsAt: localDateTimeToUtcIso(p.dateIso, p.startTime),
        endsAt: localDateTimeToUtcIso(p.dateIso, p.endTime),
        serviceId: p.serviceId,
      });
    }

    if (built.length === 0) {
      setFormError('Нельзя создать окно в прошлом.');
      return;
    }

    if (!useCabinetApi) {
      const existing = [...rows];
      let created = 0;
      let skipped = 0;
      for (const b of built) {
        const sm = new Date(b.startsAt).getTime();
        const em = new Date(b.endsAt).getTime();
        if (slotOverlapsList(sm, em, existing)) {
          skipped += 1;
          continue;
        }
        const slot = makeDemoSlot(b);
        existing.push(slot);
        created += 1;
      }
      setRows(existing);
      if (created === 0 && skipped > 0) {
        setFormError(
          built.length === 1
            ? 'Это время пересекается с другим окном'
            : 'Не удалось создать окна: выбранное время уже занято',
        );
        return;
      }
      if (skipped > 0) {
        showToast(`Создано ${windowsCountRu(created)}, ${skipped} пропущено из-за пересечения`);
      } else if (created === 1) {
        showToast('Окно добавлено');
      } else {
        showToast('Окна добавлены');
      }
      return;
    }

    setSaving(true);
    try {
      const existing = [...rows];
      let created = 0;
      let skipped = 0;
      let failed = 0;
      for (const b of built) {
        const sm = new Date(b.startsAt).getTime();
        const em = new Date(b.endsAt).getTime();
        if (slotOverlapsList(sm, em, existing)) {
          skipped += 1;
          continue;
        }
        try {
          const createdSlot = await createMySlot({
            startsAt: b.startsAt,
            endsAt: b.endsAt,
            serviceId: b.serviceId,
          });
          existing.push(createdSlot);
          created += 1;
        } catch {
          failed += 1;
        }
      }
      await reloadSlots();
      if (created === 0 && skipped > 0 && failed === 0) {
        setFormError(
          built.length === 1
            ? 'Это время пересекается с другим окном'
            : 'Не удалось создать окна: выбранное время уже занято',
        );
        return;
      }
      if (failed > 0 && created === 0) {
        setFormError('Не удалось создать окно');
        return;
      }
      if (skipped > 0 || failed > 0) {
        const parts = [`Создано ${windowsCountRu(created)}`];
        if (skipped > 0) parts.push(`${skipped} пропущено из-за пересечения`);
        if (failed > 0) parts.push(`${failed} не удалось сохранить`);
        showToast(parts.join(', '));
      } else if (created === 1) {
        showToast('Окно добавлено');
      } else {
        showToast('Окна добавлены');
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось создать окно');
    } finally {
      setSaving(false);
    }
  }, [plannedSlots, reloadSlots, rows, showToast, useCabinetApi, validatePlannedBase, validateService]);

  const onSingleOverlapCheck = useCallback(
    (startsAt: string, endsAt: string): boolean => {
      const sm = new Date(startsAt).getTime();
      const em = new Date(endsAt).getTime();
      return slotOverlapsList(sm, em, rows);
    },
    [rows],
  );

  const futureRows = useMemo(() => rows.filter((r) => new Date(r.endsAt).getTime() > Date.now()), [rows]);
  const pastRows = useMemo(() => rows.filter((r) => new Date(r.endsAt).getTime() <= Date.now()), [rows]);

  const groupedFuture = useMemo(() => {
    const sorted = [...futureRows].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    const map = new Map<string, MySlotDto[]>();
    for (const s of sorted) {
      const key = toIsoDate(new Date(s.startsAt));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => parseIsoDate(a).getTime() - parseIsoDate(b).getTime());
  }, [futureRows]);

  const previewLines = useMemo(() => futureRows.slice(0, 3), [futureRows]);

  const openDuplicate = useCallback(
    (s: MySlotDto) => {
      const a = new Date(s.startsAt);
      setDupDateIso(toIsoDate(a));
      setDupStart(formatHmFromDate(a));
      const b = new Date(s.endsAt);
      setDupEnd(formatHmFromDate(b));
      setDupServiceId(s.serviceId ?? '');
      setDupError(null);
      setDuplicateSlot(s);
    },
    [],
  );

  const closeDuplicate = useCallback(() => {
    setDuplicateSlot(null);
    setDupError(null);
  }, []);

  const submitDuplicate = useCallback(async () => {
    if (!duplicateSlot) return;
    setDupError(null);
    if (!dupDateIso.trim()) {
      setDupError('Укажите дату.');
      return;
    }
    if (!dupStart.trim() || !dupEnd.trim()) {
      setDupError('Укажите время начала и окончания.');
      return;
    }
    if (timeToMinutes(dupEnd) <= timeToMinutes(dupStart)) {
      setDupError('Время окончания должно быть позже времени начала.');
      return;
    }
    const sm = new Date(localDateTimeToUtcIso(dupDateIso, dupStart)).getTime();
    const em = new Date(localDateTimeToUtcIso(dupDateIso, dupEnd)).getTime();
    if (em - sm < 10 * 60 * 1000) {
      setDupError('Минимальная длительность окна — 10 минут.');
      return;
    }
    if (sm <= Date.now()) {
      setDupError('Нельзя создать окно в прошлом.');
      return;
    }
    const sid = dupServiceId.trim() && isUuid(dupServiceId.trim()) ? dupServiceId.trim() : null;
    const se = validateService(sid);
    if (se) {
      setDupError(se);
      return;
    }
    const startsAt = localDateTimeToUtcIso(dupDateIso, dupStart);
    const endsAt = localDateTimeToUtcIso(dupDateIso, dupEnd);
    if (onSingleOverlapCheck(startsAt, endsAt)) {
      setDupError('Это время пересекается с другим окном');
      return;
    }

    if (!useCabinetApi) {
      const slot = makeDemoSlot({ startsAt, endsAt, serviceId: sid });
      setRows((prev) => [...prev, slot]);
      showToast('Окно добавлено');
      closeDuplicate();
      return;
    }

    setDupSaving(true);
    try {
      await createMySlot({ startsAt, endsAt, serviceId: sid });
      await reloadSlots();
      showToast('Окно добавлено');
      closeDuplicate();
    } catch (e) {
      setDupError(e instanceof Error ? e.message : 'Не удалось создать окно');
    } finally {
      setDupSaving(false);
    }
  }, [
    closeDuplicate,
    dupDateIso,
    dupEnd,
    dupServiceId,
    dupStart,
    duplicateSlot,
    onSingleOverlapCheck,
    reloadSlots,
    showToast,
    useCabinetApi,
    validateService,
  ]);

  const onNextWeek = useCallback(
    async (s: MySlotDto) => {
      setFormError(null);
      const a = new Date(s.startsAt);
      const b = new Date(s.endsAt);
      const nextA = addDays(a, 7);
      const nextB = addDays(b, 7);
      const startsAt = nextA.toISOString();
      const endsAt = nextB.toISOString();
      if (new Date(startsAt).getTime() <= Date.now()) {
        setFormError('Нельзя создать окно в прошлом.');
        return;
      }
      if (onSingleOverlapCheck(startsAt, endsAt)) {
        setFormError('На следующей неделе это время уже занято');
        return;
      }
      if (!useCabinetApi) {
        setRows((prev) => [
          ...prev,
          makeDemoSlot({
            startsAt,
            endsAt,
            serviceId: s.serviceId,
          }),
        ]);
        showToast('Окно создано на следующую неделю');
        return;
      }
      setSaving(true);
      try {
        await createMySlot({ startsAt, endsAt, serviceId: s.serviceId });
        await reloadSlots();
        showToast('Окно создано на следующую неделю');
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Не удалось создать окно');
      } finally {
        setSaving(false);
      }
    },
    [onSingleOverlapCheck, reloadSlots, showToast, useCabinetApi],
  );

  const performDelete = useCallback(
    async (id: string) => {
      setFormError(null);
      if (!useCabinetApi) {
        setRows((prev) => prev.filter((x) => x.id !== id));
        showToast('Окно удалено');
        setDeleteConfirmId(null);
        return;
      }
      try {
        await deleteMySlot(id);
        await reloadSlots();
        showToast('Окно удалено');
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Не удалось удалить');
      } finally {
        setDeleteConfirmId(null);
      }
    },
    [reloadSlots, showToast, useCabinetApi],
  );

  const onDeleteClick = useCallback(
    (id: string) => {
      if (deleteConfirmId !== id) {
        setDeleteConfirmId(id);
        return;
      }
      void performDelete(id);
    },
    [deleteConfirmId, performDelete],
  );

  const onCopyLastWeek = useCallback(async () => {
    setFormError(null);
    const now = Date.now();
    const fromMs = now - 7 * 24 * 60 * 60 * 1000;
    const source = rows.filter((r) => {
      const t = new Date(r.startsAt).getTime();
      return t >= fromMs && t < now;
    });
    if (source.length === 0) {
      showToast('За прошлую неделю нет окон для копирования');
      return;
    }
    const toCreate = source.map((s) => {
      const a = new Date(s.startsAt);
      const b = new Date(s.endsAt);
      return {
        startsAt: addDays(a, 7).toISOString(),
        endsAt: addDays(b, 7).toISOString(),
        serviceId: s.serviceId,
      };
    });

    if (!useCabinetApi) {
      const existing = [...rows];
      let created = 0;
      let skipped = 0;
      for (const b of toCreate) {
        const sm = new Date(b.startsAt).getTime();
        const em = new Date(b.endsAt).getTime();
        if (sm <= Date.now() || em - sm < 10 * 60 * 1000) {
          skipped += 1;
          continue;
        }
        if (slotOverlapsList(sm, em, existing)) {
          skipped += 1;
          continue;
        }
        existing.push(makeDemoSlot(b));
        created += 1;
      }
      setRows(existing);
      showToast(created > 0 ? `Создано ${windowsCountRu(created)}${skipped ? `, ${skipped} пропущено` : ''}` : 'Не удалось создать окна');
      return;
    }

    setBulkWorking(true);
    try {
      const existing = [...rows];
      let created = 0;
      let skipped = 0;
      for (const b of toCreate) {
        const sm = new Date(b.startsAt).getTime();
        const em = new Date(b.endsAt).getTime();
        if (sm <= Date.now() || em - sm < 10 * 60 * 1000) {
          skipped += 1;
          continue;
        }
        if (slotOverlapsList(sm, em, existing)) {
          skipped += 1;
          continue;
        }
        try {
          const slot = await createMySlot({
            startsAt: b.startsAt,
            endsAt: b.endsAt,
            serviceId: b.serviceId,
          });
          existing.push(slot);
          created += 1;
        } catch {
          skipped += 1;
        }
      }
      await reloadSlots();
      showToast(created > 0 ? `Создано ${windowsCountRu(created)}${skipped ? `, ${skipped} пропущено` : ''}` : 'Не удалось создать окна');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
    } finally {
      setBulkWorking(false);
    }
  }, [reloadSlots, rows, showToast, useCabinetApi]);

  const onDeletePast = useCallback(async () => {
    if (pastRows.length === 0) return;
    setFormError(null);
    if (!useCabinetApi) {
      setRows((prev) => prev.filter((r) => new Date(r.endsAt).getTime() > Date.now()));
      showToast('Прошедшие окна удалены');
      return;
    }
    setBulkWorking(true);
    try {
      for (const r of pastRows) {
        try {
          await deleteMySlot(r.id);
        } catch {
          /* продолжаем */
        }
      }
      await reloadSlots();
      showToast('Прошедшие окна удалены');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setBulkWorking(false);
    }
  }, [pastRows, reloadSlots, showToast, useCabinetApi]);

  const onClearFuture = useCallback(async () => {
    if (clearFutureStep === 0) {
      setClearFutureStep(1);
      return;
    }
    const targets = futureRows;
    if (targets.length === 0) {
      setClearFutureStep(0);
      return;
    }
    setFormError(null);
    if (!useCabinetApi) {
      setRows((prev) => prev.filter((r) => new Date(r.endsAt).getTime() <= Date.now()));
      setClearFutureStep(0);
      showToast('Будущие окна удалены');
      return;
    }
    setBulkWorking(true);
    try {
      for (const r of targets) {
        try {
          await deleteMySlot(r.id);
        } catch {
          /* продолжаем */
        }
      }
      await reloadSlots();
      setClearFutureStep(0);
      showToast('Будущие окна удалены');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setBulkWorking(false);
    }
  }, [clearFutureStep, futureRows, reloadSlots, showToast, useCabinetApi]);

  useEffect(() => {
    if (futureRows.length === 0) setClearFutureStep(0);
  }, [futureRows.length]);

  const hasSlotsLastWeek = useMemo(() => {
    const now = Date.now();
    const fromMs = now - 7 * 24 * 60 * 60 * 1000;
    return rows.some((r) => {
      const t = new Date(r.startsAt).getTime();
      return t >= fromMs && t < now;
    });
  }, [rows]);

  const todayStart = useMemo(() => startOfLocalDay(new Date()), []);

  const weekdayShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

  const addButtonLabel =
    plannedCreatableCount > 1 ? `Добавить окна (${windowsCountRu(plannedCreatableCount)})` : 'Добавить окно';

  return (
    <div className="space-y-5">
      {!useCabinetApi ? (
        <div className="rounded-[24px] border border-neutral-200/70 bg-[#FAFAFA] px-4 py-3 text-[14px] leading-relaxed text-neutral-600">
          Демо: окна хранятся только в этом сеансе браузера. В подключённом кабинете они синхронизируются с сервером.
        </div>
      ) : null}

      {visibleServices.length === 0 ? (
        <div className="rounded-[28px] border border-amber-200/80 bg-amber-50/90 p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
          <p className="text-[17px] font-semibold text-neutral-950">Нет видимых услуг</p>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
            Добавьте или включите хотя бы одну услугу, чтобы клиенты могли записываться.
          </p>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="mt-4 flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Перейти к услугам
          </Link>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">Новое окно</h2>

        {toast ? (
          <p className="mt-4 rounded-[20px] bg-[#EAFBF2] px-4 py-3 text-center text-[14px] font-semibold text-[#2F8A5B]">
            {toast}
          </p>
        ) : null}

        <div className="mt-5 space-y-4 rounded-[24px] bg-[#F8F6F6] p-4">
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Дата</span>
            <input
              type="date"
              value={dateIso}
              onChange={(e) => {
                setDateIso(e.target.value);
                setFormError(null);
              }}
              className="mt-1.5 w-full min-h-[3rem] rounded-[18px] border border-neutral-200/60 bg-white px-4 py-3 text-[16px] font-semibold text-neutral-900 outline-none focus:border-[#E29595]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">С</span>
              <SlottySelect
                className="mt-1.5 w-full"
                value={startTime}
                onChange={(v) => {
                  setStartTime(v);
                  setFormError(null);
                }}
                options={timeOptions}
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">По</span>
              <SlottySelect
                className="mt-1.5 w-full"
                value={endTime}
                onChange={(v) => {
                  setEndTime(v);
                  setFormError(null);
                }}
                options={timeOptions}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Услуга</span>
            <SlottySelect
              className="mt-1.5 w-full"
              value={serviceId}
              disabled={visibleServices.length === 0}
              onChange={(v) => {
                setServiceId(v);
                setFormError(null);
              }}
              options={serviceOptions}
            />
          </label>

          <div className="rounded-[20px] border border-neutral-200/50 bg-white/80 p-4">
            <p className="text-[13px] font-semibold text-neutral-500">Повторять</p>
            <SlottySelect
              className="mt-2 w-full"
              value={repeatKind}
              onChange={(v) => {
                setRepeatKind(v as RepeatKind);
                setFormError(null);
              }}
              options={repeatKindOptions}
            />

            {repeatKind === 'weekly' ? (
              <label className="mt-3 block">
                <span className="text-[13px] font-semibold text-neutral-500">Сколько раз повторить</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(weeklyRepeatWeeks)}
                  onChange={(v) => setWeeklyRepeatWeeks(Number(v) as 4 | 8 | 12)}
                  options={[
                    { value: '4', label: '4 недели' },
                    { value: '8', label: '8 недель' },
                    { value: '12', label: '12 недель' },
                  ]}
                />
              </label>
            ) : null}

            {repeatKind === 'biweekly' ? (
              <label className="mt-3 block">
                <span className="text-[13px] font-semibold text-neutral-500">Сколько раз повторить</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(biweeklyRepeatTimes)}
                  onChange={(v) => setBiweeklyRepeatTimes(Number(v) as 4 | 6 | 8)}
                  options={[
                    { value: '4', label: '4 раза' },
                    { value: '6', label: '6 раз' },
                    { value: '8', label: '8 раз' },
                  ]}
                />
              </label>
            ) : null}

            {repeatKind === 'weekdays' ? (
              <label className="mt-3 block">
                <span className="text-[13px] font-semibold text-neutral-500">Период</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(weekdaySpanWeeks)}
                  onChange={(v) => setWeekdaySpanWeeks(Number(v) as 1 | 2 | 4)}
                  options={[
                    { value: '1', label: '1 неделя' },
                    { value: '2', label: '2 недели' },
                    { value: '4', label: '4 недели' },
                  ]}
                />
              </label>
            ) : null}

            {repeatKind === 'pick_weekdays' ? (
              <div className="mt-3 space-y-3">
                <p className="text-[12px] font-semibold text-neutral-400">Дни недели</p>
                <div className="flex flex-wrap gap-2">
                  {weekdayShort.map((label, idx) => (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={pickWeekdayMask[idx] === true}
                        onChange={() => {
                          setPickWeekdayMask((prev) => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          });
                        }}
                        className="h-4 w-4 accent-[#E29595]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label className="block">
                  <span className="text-[13px] font-semibold text-neutral-500">Повторять</span>
                  <SlottySelect
                    className="mt-2 w-full"
                    value={String(pickWeekdaysSpanWeeks)}
                    onChange={(v) => setPickWeekdaysSpanWeeks(Number(v) as 2 | 4 | 8)}
                    options={[
                      { value: '2', label: '2 недели' },
                      { value: '4', label: '4 недели' },
                      { value: '8', label: '8 недель' },
                    ]}
                  />
                </label>
              </div>
            ) : null}
          </div>

          <p className="text-center text-[15px] font-semibold text-neutral-800">
            Будет создано: {windowsCountRu(plannedCreatableCount)}
          </p>
          {plannedCreatableCount < plannedSlots.length && plannedSlots.length > 0 ? (
            <p className="text-center text-[12px] text-neutral-500">
              Часть дат в прошлом или короче 10 минут — они не будут созданы.
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-[20px] bg-[#FFF0F0] px-4 py-3 text-[14px] font-semibold text-[#9B2C2C]">{formError}</p>
          ) : null}

          <button
            type="button"
            disabled={saving || bulkWorking}
            onClick={() => void onAddWindows()}
            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? 'Сохранение…' : addButtonLabel}
          </button>
        </div>
      </div>

      {futureRows.length > 0 || pastRows.length > 0 || hasSlotsLastWeek ? (
        <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-[14px] font-semibold text-neutral-800">Быстрые действия</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={bulkWorking || saving || !hasSlotsLastWeek}
              onClick={() => void onCopyLastWeek()}
              className="min-h-11 rounded-full border border-neutral-200 bg-[#FAFAFA] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              Создать как на прошлой неделе
            </button>
            {pastRows.length > 0 ? (
              <button
                type="button"
                disabled={bulkWorking || saving}
                onClick={() => void onDeletePast()}
                className="min-h-11 rounded-full border border-neutral-200 bg-[#FAFAFA] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
              >
                Удалить прошедшие
              </button>
            ) : null}
            {futureRows.length > 0 ? (
              <button
                type="button"
                disabled={bulkWorking || saving}
                onClick={() => void onClearFuture()}
                className={`min-h-11 rounded-full px-4 text-[14px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
                  clearFutureStep === 1
                    ? 'bg-[#9B2C2C] text-white'
                    : 'border border-[#E29595]/40 bg-[#FFF5F5] text-[#9B2C2C]'
                }`}
              >
                {clearFutureStep === 0 ? 'Очистить будущие окна' : 'Точно очистить все будущие?'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">Активные окна</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">Эти времена видят клиенты при записи.</p>

        {loading ? (
          <p className="mt-4 text-[15px] text-neutral-500">Загрузка…</p>
        ) : futureRows.length === 0 ? (
          <div className="mt-6 rounded-[22px] border border-dashed border-neutral-200 bg-[#FAFAFA] px-4 py-8 text-center">
            <p className="text-[16px] font-semibold text-neutral-800">Пока нет свободных окон</p>
            <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
              Добавьте первое окно выше, чтобы клиенты могли выбрать время.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {groupedFuture.map(([dateKey, slots]) => {
              const header = formatGroupHeader(parseIsoDate(dateKey), todayStart);
              return (
                <div key={dateKey}>
                  <p className="mb-3 text-[15px] font-semibold text-neutral-900">{header}</p>
                  <ul className="space-y-3">
                    {slots.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-[22px] border border-neutral-100 bg-[#F8F6F6] p-4"
                      >
                        <p className="text-[16px] font-semibold text-neutral-950">{formatSlotTimeRange(s)}</p>
                        <p className="mt-1 text-[14px] text-neutral-600">{serviceTitleById(visibleServices, s.serviceId)}</p>
                        {s.status === 'available' ? (
                          <p className="mt-1 text-[12px] font-medium text-[#2F8A5B]">Свободно</p>
                        ) : null}
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={saving || bulkWorking}
                            onClick={() => openDuplicate(s)}
                            className="min-h-11 rounded-full border border-neutral-200 bg-white text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
                          >
                            Дублировать
                          </button>
                          <button
                            type="button"
                            disabled={saving || bulkWorking}
                            onClick={() => void onNextWeek(s)}
                            className="min-h-11 rounded-full border border-neutral-200 bg-white text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
                          >
                            На следующую неделю
                          </button>
                          <button
                            type="button"
                            disabled={saving || bulkWorking}
                            onClick={() => onDeleteClick(s.id)}
                            className="min-h-11 rounded-full border border-neutral-200 bg-white text-[14px] font-semibold text-[#9B2C2C] transition active:scale-[0.98] disabled:opacity-50"
                          >
                            {deleteConfirmId === s.id ? 'Точно удалить?' : 'Удалить это окно?'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h3 className="text-[16px] font-semibold text-neutral-950">Как увидит клиент</h3>
        {previewLines.length === 0 ? (
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">Клиенты пока не увидят доступного времени.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {previewLines.map((s) => (
              <li
                key={s.id}
                className="rounded-[16px] bg-[#F8F6F6] px-3 py-2.5 text-[14px] font-medium text-neutral-800"
              >
                {formatClientPreviewLine(s)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {duplicateSlot ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={closeDuplicate}
        >
          <div
            role="dialog"
            aria-modal
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[18px] font-semibold text-neutral-950">Дублировать окно</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">Дата</span>
                <input
                  type="date"
                  value={dupDateIso}
                  onChange={(e) => {
                    setDupDateIso(e.target.value);
                    setDupError(null);
                  }}
                  className="mt-1.5 w-full min-h-[3rem] rounded-[18px] border border-neutral-200/60 bg-white px-4 py-3 text-[16px] font-semibold outline-none focus:border-[#E29595]"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[13px] font-semibold text-neutral-500">С</span>
                  <SlottySelect className="mt-1.5 w-full" value={dupStart} onChange={setDupStart} options={dupTimeOptions} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-neutral-500">По</span>
                  <SlottySelect className="mt-1.5 w-full" value={dupEnd} onChange={setDupEnd} options={dupTimeOptions} />
                </label>
              </div>
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">Услуга</span>
                <SlottySelect
                  className="mt-1.5 w-full"
                  value={dupServiceId}
                  disabled={visibleServices.length === 0}
                  onChange={setDupServiceId}
                  options={serviceOptions}
                />
              </label>
            </div>
            {dupError ? <p className="mt-3 text-[14px] font-semibold text-[#9B2C2C]">{dupError}</p> : null}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={dupSaving}
                onClick={() => void submitDuplicate()}
                className="flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white disabled:opacity-50"
              >
                {dupSaving ? 'Создание…' : 'Создать копию'}
              </button>
              <button
                type="button"
                onClick={closeDuplicate}
                className="min-h-11 rounded-full border border-neutral-200 text-[14px] font-semibold text-neutral-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
