import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { useAdminAppointments } from '../useAdminMasterData';
import { AddWindowSheet } from './AddWindowSheet';
import { CreateTemplateModal } from './CreateTemplateModal';
import { EditWindowModal } from './EditWindowModal';
import { ScheduleBottomTabBar } from './ScheduleBottomTabBar';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleCreateTab } from './ScheduleCreateTab';
import { ScheduleSlotsListTab } from './ScheduleSlotsListTab';
import { SCHEDULE_PAGE_BG, SCHEDULE_TAB_BAR_SCROLL_PAD } from './adminScheduleTheme';
import { SCHEDULE_TAB_INTRO_IMAGES, ScheduleTabIntro } from './ScheduleTabIntro';
import type { PlannedSlot, RepeatKind, SchedulePageTab, ScheduleWindowView } from './scheduleTypes';
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
import type { RepeatCount } from './RepeatSettings';
import { useScheduleData } from './useScheduleData';

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

function serviceIsActive(service: { isActive?: boolean }): boolean {
  return service.isActive !== false;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type OpenAddSheetOptions = {
  templateId?: string;
  withoutTemplate?: boolean;
};

export function AdminScheduleTab({ draft }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { appointments } = useAdminAppointments();
  const masterId = draft.masterId ?? 'local';
  const visibleServices = useMemo(() => draft.services.filter(serviceIsActive), [draft.services]);

  const {
    windows,
    loading,
    templates,
    persistTemplates,
    scheduleHorizonDays,
    slotOverlaps,
    createSlots,
    updateSlot,
    removeSlot,
  } = useScheduleData(masterId, visibleServices, useCabinetApi, appointments);

  const [pageTab, setPageTab] = useState<SchedulePageTab>('create');

  useEffect(() => {
    preloadTabIntroImages(SCHEDULE_TAB_INTRO_IMAGES);
  }, []);
  const [toast, setToast] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const addWindowsLockRef = useRef(false);

  const [dateIso, setDateIso] = useState(todayIso);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [serviceId, setServiceId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [repeatKind, setRepeatKind] = useState<RepeatKind>('none');
  const [repeatCount, setRepeatCount] = useState<RepeatCount>(4);

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [editWindow, setEditWindow] = useState<ScheduleWindowView | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

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
    if (manualMode || !selectedTemplate) return;
    setServiceId(selectedTemplate.serviceId);
    setEndTime(addMinutesToTime(startTime, selectedTemplate.durationMinutes));
  }, [manualMode, selectedTemplate, startTime]);

  const effectiveServiceId = useMemo(() => {
    if (selectedTemplate && !manualMode) return selectedTemplate.serviceId;
    const sid = serviceId.trim();
    return sid && isUuid(sid) ? sid : null;
  }, [manualMode, selectedTemplate, serviceId]);

  const plannedSlots: PlannedSlot[] = useMemo(() => {
    const sid = effectiveServiceId;
    return buildPlannedSlots(
      dateIso,
      startTime,
      endTime,
      sid,
      repeatKind,
      repeatCount,
      repeatCount,
      repeatCount,
    );
  }, [dateIso, effectiveServiceId, endTime, repeatCount, repeatKind, startTime]);

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
        setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
      }
    },
    [startTime, templates],
  );

  const openAddSheet = useCallback(
    (opts?: OpenAddSheetOptions) => {
      setCreateError(null);
      if (opts?.templateId) {
        applyTemplate(opts.templateId);
      } else if (opts?.withoutTemplate) {
        setSelectedTemplateId(null);
        setManualMode(true);
        setServiceId('');
      } else {
        setSelectedTemplateId(null);
        setManualMode(false);
      }
      setAddSheetOpen(true);
    },
    [applyTemplate],
  );

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
      setPageTab('calendar');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Ошибка создания');
    } finally {
      addWindowsLockRef.current = false;
      setSaving(false);
    }
  }, [createSlots, plannedSlots, scheduleHorizonDays, showToast, validateBase]);

  const onSaveTemplate = (tpl: import('./scheduleTypes').WindowTemplate) => {
    persistTemplates([...templates, tpl]);
    setSelectedTemplateId(tpl.id);
    setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
    showToast('Шаблон сохранён');
  };

  const onEditSave = async (payload: {
    dateIso: string;
    startTime: string;
    endTime: string;
    serviceId: string | null;
  }) => {
    if (!editWindow) return;
    if (isLocalDateIsoBeforeToday(payload.dateIso)) {
      showToast('Нельзя перенести в прошлое');
      return;
    }
    if (timeToMinutes(payload.endTime) <= timeToMinutes(payload.startTime)) {
      showToast('Проверьте время');
      return;
    }
    const startsAt = localDateTimeToUtcIso(payload.dateIso, payload.startTime);
    const endsAt = localDateTimeToUtcIso(payload.dateIso, payload.endTime);
    if (slotOverlaps(startsAt, endsAt, editWindow.id)) {
      showToast('Время пересекается с другим окном');
      return;
    }
    setEditSaving(true);
    try {
      await updateSlot(editWindow.id, {
        startsAt,
        endsAt,
        serviceId: payload.serviceId,
      });
      showToast('Изменения сохранены');
      setEditWindow(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setEditSaving(false);
    }
  };

  const onEditDelete = async () => {
    if (!editWindow) return;
    setEditSaving(true);
    try {
      await removeSlot(editWindow.id);
      showToast('Окно удалено');
      setEditWindow(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      <div
        className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 ${SCHEDULE_PAGE_BG}`}
        style={{ paddingBottom: SCHEDULE_TAB_BAR_SCROLL_PAD }}
      >
        <ScheduleTabIntro tab={pageTab} />

        {pageTab === 'create' ? (
          <ScheduleCreateTab
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={(id) => {
              applyTemplate(id);
              openAddSheet({ templateId: id });
            }}
            onCreateTemplate={() => setTemplateSheetOpen(true)}
            onOpenNewWindow={() => openAddSheet()}
            onOpenWithoutTemplate={() => openAddSheet({ withoutTemplate: true })}
          />
        ) : null}

        {pageTab === 'calendar' ? (
          <ScheduleCalendar
            windows={windows}
            loading={loading}
            onWindowClick={(w) => setEditWindow(w)}
          />
        ) : null}

        {pageTab === 'list' ? (
          <ScheduleSlotsListTab
            windows={windows}
            loading={loading}
            onWindowClick={(w) => setEditWindow(w)}
          />
        ) : null}
      </div>

      <ScheduleBottomTabBar active={pageTab} onChange={setPageTab} />

      <AddWindowSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        dateIso={dateIso}
        onDateIsoChange={setDateIso}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        manualMode={manualMode}
        onManualModeChange={setManualMode}
        serviceId={serviceId}
        onServiceIdChange={setServiceId}
        selectedTemplateId={selectedTemplateId}
        templates={templates}
        services={visibleServices}
        serviceOptions={serviceOptions}
        repeatKind={repeatKind}
        onRepeatKindChange={setRepeatKind}
        repeatCount={repeatCount}
        onRepeatCountChange={setRepeatCount}
        plannedSlots={plannedSlots}
        creatableCount={plannedStats.creatable}
        beyondHorizon={plannedStats.beyondHorizon}
        horizonDays={scheduleHorizonDays}
        summaryLine={summaryLine}
        createError={createError}
        saving={saving}
        onSubmit={() => void onAddWindows()}
      />

      <CreateTemplateModal
        open={templateSheetOpen}
        onClose={() => setTemplateSheetOpen(false)}
        services={visibleServices.filter((s) => isUuid(s.id))}
        templates={templates}
        onSave={onSaveTemplate}
      />

      <EditWindowModal
        open={editWindow != null}
        window={editWindow}
        onClose={() => setEditWindow(null)}
        services={visibleServices}
        templates={templates}
        saving={editSaving}
        onSave={(p) => void onEditSave(p)}
        onDelete={() => void onEditDelete()}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px)+1rem)] left-1/2 z-[300] w-[min(92vw,20rem)] -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-3 text-center text-[14px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}
