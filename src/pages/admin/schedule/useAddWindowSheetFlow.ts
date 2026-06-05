import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminToast } from '../shared/useAdminToast';
import { DEFAULT_REPEAT_SETTINGS, type RepeatSettingsValue } from './RepeatSettings';
import { MSG_SLOTS_ALL_BUSY } from './scheduleTypes';
import {
  addMinutesToTime,
  buildPlannedSlots,
  evaluatePlannedSlot,
  isLocalDateIsoBeforeToday,
  localDateTimeToUtcIso,
  serviceTitleById,
  templateDisplayLabel,
  timeToMinutes,
  windowsCountRu,
} from './scheduleUtils';
import { useScheduleData } from './useScheduleData';

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function serviceIsActive(service: { isActive?: boolean }): boolean {
  return service.isActive !== false;
}

export type OpenAddSheetOptions = {
  templateId?: string;
  withoutTemplate?: boolean;
  dateIso?: string;
};

type Options = {
  draft: MasterDraft;
  useCabinetApi: boolean;
  appointments: DemoMasterAppointment[];
  onCreated?: (created: number) => void;
};

export function useAddWindowSheetFlow({
  draft,
  useCabinetApi,
  appointments,
  onCreated,
}: Options) {
  const masterId = draft.masterId ?? 'local';
  const visibleServices = useMemo(() => draft.services.filter(serviceIsActive), [draft.services]);
  const { showToast } = useAdminToast();

  const {
    windows,
    templates,
    scheduleHorizonDays,
    reloadSlots,
    createSlots,
  } = useScheduleData(masterId, visibleServices, useCabinetApi, appointments);

  const existingSlotRanges = useMemo(
    () => windows.map((w) => ({ startsAt: w.slot.startsAt, endsAt: w.slot.endsAt })),
    [windows],
  );

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const addWindowsLockRef = useRef(false);

  const [dateIso, setDateIso] = useState(todayIso);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [serviceId, setServiceId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(true);
  const [repeatSettings, setRepeatSettings] = useState<RepeatSettingsValue>(DEFAULT_REPEAT_SETTINGS);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...visibleServices.filter((s) => isUuid(s.id)).map((s) => ({ value: s.id, label: s.title })),
    ],
    [visibleServices],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!selectedTemplateId) return;
    if (!templates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(null);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (manualMode || !selectedTemplate) return;
    setServiceId(selectedTemplate.serviceId);
    setEndTime(addMinutesToTime(startTime, selectedTemplate.durationMinutes));
  }, [manualMode, selectedTemplate, startTime]);

  const effectiveServiceId = useMemo(() => {
    if (selectedTemplate && !manualMode) return selectedTemplate.serviceId;
    const sid = serviceId.trim();
    return sid && isUuid(sid) ? sid : null;
  }, [manualMode, selectedTemplate, serviceId]);

  const templateModeActive = Boolean(selectedTemplate && !manualMode);
  void templateModeActive;

  const plannedSlots = useMemo(() => {
    return buildPlannedSlots(dateIso, startTime, endTime, effectiveServiceId, repeatSettings);
  }, [dateIso, effectiveServiceId, endTime, repeatSettings, startTime]);

  const plannedStats = useMemo(() => {
    const now = Date.now();
    let creatable = 0;
    let beyondHorizon = 0;
    for (const p of plannedSlots) {
      const ev = evaluatePlannedSlot(p, now, scheduleHorizonDays);
      if (ev.ok) creatable += 1;
      else if (ev.reason === 'horizon') beyondHorizon += 1;
    }
    return { creatable, beyondHorizon };
  }, [plannedSlots, scheduleHorizonDays]);

  const summaryLine = useMemo(() => {
    const name =
      selectedTemplate && !manualMode
        ? templateDisplayLabel(selectedTemplate)
        : serviceTitleById(visibleServices, effectiveServiceId);
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return null;
    return `${name} · ${startTime}–${endTime}`;
  }, [effectiveServiceId, endTime, manualMode, selectedTemplate, startTime, visibleServices]);

  const applyTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      setManualMode(false);
      const tpl = templates.find((t) => t.id === id);
      if (tpl) {
        setServiceId(tpl.serviceId);
        const st = startTime || '12:00';
        setStartTime(st);
        setEndTime(addMinutesToTime(st, tpl.durationMinutes));
      }
    },
    [startTime, templates],
  );

  const openAddSheet = useCallback(
    (opts?: OpenAddSheetOptions) => {
      setCreateError(null);
      if (opts?.dateIso) setDateIso(opts.dateIso);
      if (opts?.templateId) {
        applyTemplate(opts.templateId);
      } else if (opts?.withoutTemplate) {
        setSelectedTemplateId(null);
        setManualMode(true);
        setServiceId('');
      } else {
        setSelectedTemplateId(null);
        setManualMode(templates.length === 0);
      }
      setAddSheetOpen(true);
    },
    [applyTemplate, templates.length],
  );

  const closeAddSheet = useCallback(() => {
    setAddSheetOpen(false);
    setCreateError(null);
  }, []);

  const useManualAddWindow = useCallback(() => {
    setSelectedTemplateId(null);
    setManualMode(true);
    setServiceId('');
    setCreateError(null);
  }, []);

  const useTemplateAddWindow = useCallback(() => {
    setManualMode(false);
    setCreateError(null);
    if (!selectedTemplateId && templates.length === 1) {
      applyTemplate(templates[0]!.id);
    } else if (selectedTemplateId) {
      applyTemplate(selectedTemplateId);
    }
  }, [applyTemplate, selectedTemplateId, templates]);

  const validateBase = useCallback((): string | null => {
    if (!dateIso.trim()) return 'Укажите дату.';
    if (isLocalDateIsoBeforeToday(dateIso)) return 'Нельзя выбрать дату в прошлом.';
    if (!startTime.trim() || !endTime.trim()) return 'Укажите время.';
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return 'Время окончания должно быть позже начала.';
    }
    if (plannedStats.creatable === 0) {
      if (plannedStats.beyondHorizon > 0 && scheduleHorizonDays) {
        return `По тарифу запись доступна не дальше чем на ${scheduleHorizonDays} дней вперёд.`;
      }
      return 'Нельзя создать окно в прошлом.';
    }
    if (effectiveServiceId && !visibleServices.some((s) => s.id === effectiveServiceId)) {
      return 'Услуга недоступна или скрыта.';
    }
    return null;
  }, [
    dateIso,
    effectiveServiceId,
    endTime,
    plannedStats.beyondHorizon,
    plannedStats.creatable,
    scheduleHorizonDays,
    startTime,
    visibleServices,
  ]);

  const onAddWindows = useCallback(async () => {
    setCreateError(null);
    const err = validateBase();
    if (err) {
      setCreateError(err);
      return;
    }

    const now = Date.now();
    const built: { startsAt: string; endsAt: string; serviceId: string | null }[] = [];
    for (const p of plannedSlots) {
      const ev = evaluatePlannedSlot(p, now, scheduleHorizonDays);
      if (!ev.ok) continue;
      built.push({
        startsAt: localDateTimeToUtcIso(p.dateIso, p.startTime),
        endsAt: localDateTimeToUtcIso(p.dateIso, p.endTime),
        serviceId: p.serviceId,
      });
    }
    if (built.length === 0) {
      setCreateError('Нельзя создать окно в прошлом.');
      return;
    }

    if (addWindowsLockRef.current) return;
    addWindowsLockRef.current = true;
    setSaving(true);
    try {
      const { created, skipped, horizonFailed, failed } = await createSlots(built);
      if (created === 0 && skipped > 0 && failed === 0) {
        setCreateError(built.length === 1 ? 'Это время пересекается с другим окном' : MSG_SLOTS_ALL_BUSY);
        return;
      }
      if (failed > 0 && created === 0) {
        setCreateError(
          horizonFailed > 0 && scheduleHorizonDays
            ? `По тарифу запись доступна не дальше чем на ${scheduleHorizonDays} дней вперёд.`
            : 'Не удалось создать окно',
        );
        return;
      }
      if (skipped > 0 || failed > 0) {
        const parts: string[] = [];
        if (created > 0) parts.push(`Создано ${windowsCountRu(created)}`);
        if (skipped > 0) parts.push(`${skipped} пропущено`);
        if (horizonFailed > 0) parts.push(`${horizonFailed} за пределами тарифа`);
        showToast(parts.join(', '));
      } else if (created === 1) {
        showToast('Окно добавлено');
      } else {
        showToast('Окна добавлены');
      }
      setAddSheetOpen(false);
      await reloadSlots();
      onCreated?.(created);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Ошибка создания');
    } finally {
      addWindowsLockRef.current = false;
      setSaving(false);
    }
  }, [createSlots, onCreated, plannedSlots, reloadSlots, scheduleHorizonDays, showToast, validateBase]);

  return {
    addSheetOpen,
    openAddSheet,
    closeAddSheet,
    onAddWindows,
    reloadSlots,
    scheduleHorizonDays,
    existingSlotRanges,
    visibleServices,
    addWindowSheetProps: {
      dateIso,
      onDateIsoChange: setDateIso,
      startTime,
      onStartTimeChange: setStartTime,
      endTime,
      onEndTimeChange: setEndTime,
      manualMode,
      onManualModeChange: setManualMode,
      serviceId,
      onServiceIdChange: setServiceId,
      selectedTemplateId,
      onTemplateSelect: applyTemplate,
      onUseManualMode: useManualAddWindow,
      onUseTemplateMode: useTemplateAddWindow,
      templates,
      services: visibleServices,
      serviceOptions,
      repeatSettings,
      onRepeatSettingsChange: setRepeatSettings,
      plannedSlots,
      creatableCount: plannedStats.creatable,
      beyondHorizon: plannedStats.beyondHorizon,
      horizonDays: scheduleHorizonDays,
      summaryLine,
      createError,
      saving,
      onSubmit: () => void onAddWindows(),
    },
  };
}
