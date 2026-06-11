import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { useAdminSectionTab } from '../useAdminSectionTab';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useAdminAppointments } from '../useAdminMasterData';
import { AdminDesktopSectionTabsShell } from '../shared/AdminDesktopSectionTabsShell';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import { AddWindowSheet } from './AddWindowSheet';
import { CreateMonthScheduleWizard } from './CreateMonthScheduleWizard';
import { CreateTemplateModal } from './CreateTemplateModal';
import { WindowTemplateMenuSheet } from './WindowTemplateMenuSheet';
import type { WindowTemplate } from './scheduleTypes';
import { EditWindowModal } from './EditWindowModal';
import { ScheduleBottomTabBar } from './ScheduleBottomTabBar';
import { ScheduleSectionTabs } from './ScheduleSectionTabs';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleCreateTab } from './ScheduleCreateTab';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from '../services/ServicesTabFab';
import { ScheduleSlotsListTab } from './ScheduleSlotsListTab';
import {
  SCHEDULE_MOBILE_CANVAS,
  SCHEDULE_TAB_BAR_SCROLL_PAD,
  scheduleShellCard,
  scheduleTabContentPad,
  scheduleTabPanelShellCalendar,
  scheduleTabPanelShellCreate,
} from './adminScheduleTheme';
import { SCHEDULE_TAB_INTRO_IMAGES } from './ScheduleTabIntro';
import { computeScheduleTabMetrics } from './scheduleTabMetrics';
import type { PlannedSlot, SchedulePageTab, ScheduleWindowView } from './scheduleTypes';
import { MSG_SLOTS_ALL_BUSY } from './scheduleTypes';
import {
  addMinutesToTime,
  buildPlannedSlots,
  evaluatePlannedSlot,
  isLocalDateIsoBeforeToday,
  isScheduleWindowBooked,
  localDateTimeToUtcIso,
  MSG_SCHEDULE_WINDOW_BOOKED,
  serviceTitleById,
  templateDisplayLabel,
  timeToMinutes,
  windowsCountRu,
} from './scheduleUtils';
import { DEFAULT_REPEAT_SETTINGS, type RepeatSettingsValue } from './RepeatSettings';
import { useScheduleData } from './useScheduleData';
import {
  DUPLICATE_WINDOW_TEMPLATE_MSG,
  isDuplicateWindowTemplate,
} from './windowTemplateStorage';

const SCHEDULE_TABS = ['create', 'calendar', 'list'] as const satisfies readonly SchedulePageTab[];

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
  dateIso?: string;
  serviceId?: string;
};

export function AdminScheduleTab({ draft }: Props) {
  const masterWrite = useMasterPlatformAccess();
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
    reloadSlots,
    slotOverlaps,
    createSlots,
    updateSlot,
    removeSlot,
    loadError,
  } = useScheduleData(masterId, visibleServices, useCabinetApi, appointments);

  const [searchParams, setSearchParams] = useSearchParams();
  const [monthWizardOpen, setMonthWizardOpen] = useState(false);
  const [monthWizardDays, setMonthWizardDays] = useState<7 | 14 | 30>(30);
  const handledAddWindowLinkRef = useRef<string | null>(null);

  const monthWizardServiceId = searchParams.get('serviceId');

  useEffect(() => {
    const wizard = searchParams.get('wizard');
    if (wizard === 'month') {
      setMonthWizardDays(30);
      setMonthWizardOpen(true);
    } else if (wizard === 'week') {
      setMonthWizardDays(7);
      setMonthWizardOpen(true);
    }
  }, [searchParams]);

  const closeMonthWizard = () => {
    setMonthWizardOpen(false);
    if (searchParams.get('wizard')) {
      const next = new URLSearchParams(searchParams);
      next.delete('wizard');
      next.delete('serviceId');
      setSearchParams(next, { replace: true });
    }
  };

  const activeFutureSlotCount = useMemo(
    () =>
      windows.filter(
        (w) => w.status === 'free' && new Date(w.slot.startsAt).getTime() > Date.now(),
      ).length,
    [windows],
  );

  const existingSlotRanges = useMemo(
    () => windows.map((w) => ({ startsAt: w.slot.startsAt, endsAt: w.slot.endsAt })),
    [windows],
  );

  const reloadWindows = useCallback(async () => {
    await reloadSlots();
  }, [reloadSlots]);

  const [pageTab, setPageTab] = useAdminSectionTab('tab', 'create', SCHEDULE_TABS);

  useEffect(() => {
    preloadTabIntroImages(SCHEDULE_TAB_INTRO_IMAGES);
  }, []);

  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const addWindowsLockRef = useRef(false);

  const [dateIso, setDateIso] = useState(todayIso);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [serviceId, setServiceId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(true);
  const [repeatSettings, setRepeatSettings] = useState<RepeatSettingsValue>(DEFAULT_REPEAT_SETTINGS);

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [templateMenuTarget, setTemplateMenuTarget] = useState<WindowTemplate | null>(null);
  const [editWindow, setEditWindow] = useState<ScheduleWindowView | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const editWindowLive = useMemo(() => {
    if (!editWindow) return null;
    return windows.find((w) => w.id === editWindow.id) ?? editWindow;
  }, [editWindow, windows]);

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

  const plannedSlots: PlannedSlot[] = useMemo(() => {
    const sid = effectiveServiceId;
    return buildPlannedSlots(dateIso, startTime, endTime, sid, repeatSettings);
  }, [
    dateIso,
    effectiveServiceId,
    endTime,
    repeatSettings,
    startTime,
  ]);

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
  }, [
    effectiveServiceId,
    endTime,
    manualMode,
    selectedTemplate,
    startTime,
    visibleServices,
  ]);

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
      if (opts?.dateIso) {
        setDateIso(opts.dateIso);
      }
      if (opts?.templateId) {
        applyTemplate(opts.templateId);
      } else if (opts?.serviceId) {
        setSelectedTemplateId(null);
        setManualMode(true);
        setServiceId(opts.serviceId);
      } else if (opts?.withoutTemplate || opts?.dateIso) {
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

  useEffect(() => {
    if (searchParams.get('addWindow') !== '1') return;

    const sid = searchParams.get('serviceId');
    const linkKey = `${sid ?? ''}:${searchParams.toString()}`;
    if (handledAddWindowLinkRef.current === linkKey) return;
    handledAddWindowLinkRef.current = linkKey;

    openAddSheet({
      serviceId: sid && isUuid(sid) ? sid : undefined,
    });

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('addWindow');
        next.delete('serviceId');
        return next;
      },
      { replace: true },
    );
  }, [openAddSheet, searchParams, setSearchParams]);

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
      applyTemplate(templates[0].id);
    } else if (selectedTemplateId) {
      applyTemplate(selectedTemplateId);
    }
  }, [applyTemplate, selectedTemplateId, templates]);

  const validateBase = useCallback((): string | null => {
    if (!dateIso.trim()) return 'Укажите дату.';
    if (isLocalDateIsoBeforeToday(dateIso)) return 'Нельзя выбрать дату в прошлом.';
    if (templateModeActive) {
      if (!startTime.trim() || !endTime.trim()) return 'Укажите время.';
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return 'Время окончания должно быть позже начала.';
      }
    } else {
      if (!startTime.trim() || !endTime.trim()) return 'Укажите время.';
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return 'Время окончания должно быть позже начала.';
      }
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
    templateModeActive,
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

  const onDeleteTemplate = useCallback(
    (id: string) => {
      const tpl = templates.find((t) => t.id === id);
      if (!tpl) return;

      persistTemplates(templates.filter((t) => t.id !== id));

      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
        if (addSheetOpen) {
          setServiceId(tpl.serviceId);
          setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
          if (!manualMode) setManualMode(true);
        }
      }

      setTemplateMenuTarget((prev) => (prev?.id === id ? null : prev));
      showToast('Шаблон удалён');
    },
    [addSheetOpen, manualMode, persistTemplates, selectedTemplateId, showToast, startTime, templates],
  );

  const onSaveTemplate = (tpl: import('./scheduleTypes').WindowTemplate) => {
    if (isDuplicateWindowTemplate(templates, tpl)) {
      showErrorToast(DUPLICATE_WINDOW_TEMPLATE_MSG);
      return;
    }
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
    if (!editWindowLive) return;
    if (isScheduleWindowBooked(editWindowLive, appointments)) {
      showToast('На это окно уже есть запись — изменить нельзя');
      return;
    }
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
    if (slotOverlaps(startsAt, endsAt, editWindowLive.id)) {
      showToast('Время пересекается с другим окном');
      return;
    }
    setEditSaving(true);
    try {
      await updateSlot(editWindowLive.id, {
        startsAt,
        endsAt,
        serviceId: payload.serviceId,
      });
      showToast('Изменения сохранены');
      setEditWindow(null);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setEditSaving(false);
    }
  };

  const tabMetrics = useMemo(
    () => computeScheduleTabMetrics(windows, templates, visibleServices.length),
    [templates, visibleServices.length, windows],
  );

  const onEditDelete = async () => {
    if (!editWindowLive) return;
    if (isScheduleWindowBooked(editWindowLive, appointments)) {
      showToast(MSG_SCHEDULE_WINDOW_BOOKED);
      return;
    }
    setEditSaving(true);
    try {
      await removeSlot(editWindowLive.id);
      showToast('Окно удалено');
      setEditWindow(null);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setEditSaving(false);
    }
  };

  const tabPanels = (
    <>
      <AdminTabContentTransition activeKey={pageTab}>
        {pageTab === 'create' ? (
          <div className={scheduleTabPanelShellCreate}>
            <ScheduleCreateTab
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              createMetrics={tabMetrics.create}
              activeSlotCount={activeFutureSlotCount}
              masterId={draft.masterId}
              slotsLoadError={loadError}
              onTemplateSelect={(id) => {
                applyTemplate(id);
                openAddSheet({ templateId: id });
              }}
              onTemplateMenu={setTemplateMenuTarget}
              onCreateTemplate={() => setTemplateSheetOpen(true)}
              onOpenWithoutTemplate={() => openAddSheet({ withoutTemplate: true })}
              onAddToday={() => openAddSheet({ dateIso: todayIso() })}
              onCreateWeek={() => {
                setMonthWizardDays(7);
                setMonthWizardOpen(true);
              }}
              onCreateMonth={() => {
                setMonthWizardDays(30);
                setMonthWizardOpen(true);
              }}
              onCreateFromSchedule={() => {
                setMonthWizardDays(30);
                setMonthWizardOpen(true);
              }}
            />
          </div>
        ) : null}

        {pageTab === 'calendar' ? (
          <div className={scheduleTabPanelShellCalendar}>
            <div className={scheduleTabContentPad}>
              <ScheduleCalendar
                windows={windows}
                loading={loading}
                calendarMetrics={tabMetrics.calendar}
                masterName={draft.name?.trim() || 'Мастер'}
                onWindowClick={(w) => setEditWindow(w)}
                onCreateForDay={(iso) => openAddSheet({ dateIso: iso })}
                canCreateForDay={masterWrite.canMutate}
                createForDayDisabledTitle={masterWrite.mutateDisabledTitle}
              />
            </div>
          </div>
        ) : null}

        {pageTab === 'list' ? (
          <div className={scheduleTabPanelShellCalendar}>
            <div className={scheduleTabContentPad}>
              <ScheduleSlotsListTab
                windows={windows}
                loading={loading}
                onWindowClick={(w) => setEditWindow(w)}
                onCreateForDay={(iso) => openAddSheet({ dateIso: iso })}
                canCreateForDay={masterWrite.canMutate}
                createForDayDisabledTitle={masterWrite.mutateDisabledTitle}
              />
            </div>
          </div>
        ) : null}
      </AdminTabContentTransition>
    </>
  );

  return (
    <>
      <ScheduleBottomTabBar active={pageTab} onChange={setPageTab} variant="mobile" />

      <section
        className={`-mx-4 min-w-0 space-y-4 px-4 ${SCHEDULE_TAB_BAR_SCROLL_PAD} lg:hidden ${SCHEDULE_MOBILE_CANVAS}`}
      >
        {tabPanels}
      </section>

      <div className={`${scheduleShellCard} space-y-6`}>
        <AdminDesktopSectionTabsShell>
          <ScheduleSectionTabs active={pageTab} onChange={setPageTab} />
        </AdminDesktopSectionTabsShell>

        <div className="min-w-0 w-full max-w-none space-y-6">{tabPanels}</div>
      </div>

      <CreateMonthScheduleWizard
        open={monthWizardOpen}
        onClose={closeMonthWizard}
        masterId={draft.masterId}
        services={visibleServices
          .filter((s) => isUuid(s.id))
          .map((s) => ({
            id: s.id,
            title: s.title,
            durationMin: s.durationMin ?? 60,
          }))}
        defaultWorkDays={draft.schedule?.workDays ?? []}
        defaultStartTime={draft.schedule?.startTime ?? '10:00'}
        defaultEndTime={draft.schedule?.endTime ?? '19:00'}
        scheduleHorizonDays={scheduleHorizonDays}
        existingSlots={existingSlotRanges}
        initialPeriodDays={monthWizardDays}
        initialServiceId={monthWizardServiceId}
        useCabinetApi={useCabinetApi}
        onCreated={() => {
          void reloadWindows();
        }}
      />

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
        onTemplateSelect={applyTemplate}
        onUseManualMode={useManualAddWindow}
        onUseTemplateMode={useTemplateAddWindow}
        templates={templates}
        services={visibleServices}
        serviceOptions={serviceOptions}
        repeatSettings={repeatSettings}
        onRepeatSettingsChange={setRepeatSettings}
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

      <WindowTemplateMenuSheet
        open={templateMenuTarget != null}
        template={templateMenuTarget}
        onClose={() => setTemplateMenuTarget(null)}
        onDelete={() => {
          if (templateMenuTarget) onDeleteTemplate(templateMenuTarget.id);
        }}
      />

      {pageTab === 'create' ? (
        <ServicesTabFab
          ariaLabel="Новое окно"
          onClick={() => openAddSheet()}
          disabled={!masterWrite.canMutate}
          disabledTitle={masterWrite.mutateDisabledTitle}
          variant="schedule"
        />
      ) : null}

      <EditWindowModal
        open={editWindowLive != null}
        window={editWindowLive}
        masterId={draft.masterId}
        draft={draft}
        appointments={appointments}
        onClose={() => setEditWindow(null)}
        services={visibleServices}
        templates={templates}
        saving={editSaving}
        onSave={(p) => void onEditSave(p)}
        onDelete={() => void onEditDelete()}
      />

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}
