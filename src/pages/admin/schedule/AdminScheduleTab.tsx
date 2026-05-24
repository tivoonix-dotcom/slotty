import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { useAdminAppointments } from '../useAdminMasterData';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import { AddWindowSheet } from './AddWindowSheet';
import { CreateTemplateModal } from './CreateTemplateModal';
import { WindowTemplateMenuSheet } from './WindowTemplateMenuSheet';
import type { WindowTemplate } from './scheduleTypes';
import { EditWindowModal } from './EditWindowModal';
import { ScheduleBottomTabBar } from './ScheduleBottomTabBar';
import { ScheduleSectionTabs } from './ScheduleSectionTabs';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleCreateTab } from './ScheduleCreateTab';
import { ServicesTabFab } from '../services/ServicesTabFab';
import { ScheduleSlotsListTab } from './ScheduleSlotsListTab';
import {
  SCHEDULE_PAGE_BG,
  scheduleDesktopCard,
  scheduleDesktopTabsSticky,
  scheduleShellCard,
  scheduleTabPanelShell,
} from './adminScheduleTheme';
import { SCHEDULE_TAB_INTRO_IMAGES } from './ScheduleTabIntro';
import { SchedulePageHeader } from './SchedulePageHeader';
import { computeScheduleTabMetrics } from './scheduleTabMetrics';
import type { PlannedSlot, SchedulePageTab, ScheduleWindowView } from './scheduleTypes';
import { MSG_SLOTS_ALL_BUSY } from './scheduleTypes';
import {
  addMinutesToTime,
  buildPlannedSlots,
  evaluatePlannedSlot,
  filterValidTemplateStartTimes,
  isLocalDateIsoBeforeToday,
  localDateTimeToUtcIso,
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
import { SmartPromotionSuggestionsPanel } from './SmartPromotionSuggestionsPanel';
import { useSmartPromotionSuggestions } from './useSmartPromotionSuggestions';
import type { SmartPromotionSuggestionDto } from '../../../features/admin/api/smartPromotionSuggestionsApi';

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
    reloadSlots,
  } = useScheduleData(masterId, visibleServices, useCabinetApi, appointments);

  const smartPromo = useSmartPromotionSuggestions(useCabinetApi);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(() => new Set());
  const [listFocusDayIso, setListFocusDayIso] = useState<string | null>(null);

  const [pageTab, setPageTab] = useState<SchedulePageTab>('create');

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
  const [manualMode, setManualMode] = useState(false);
  const [repeatSettings, setRepeatSettings] = useState<RepeatSettingsValue>(DEFAULT_REPEAT_SETTINGS);
  const [templateStartTimes, setTemplateStartTimes] = useState<string[]>(['12:00']);

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [templateMenuTarget, setTemplateMenuTarget] = useState<WindowTemplate | null>(null);
  const [editWindow, setEditWindow] = useState<ScheduleWindowView | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const dismissSuggestion = useCallback((id: string) => {
    setDismissedSuggestionIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const onViewSuggestionWindows = useCallback((suggestion: SmartPromotionSuggestionDto) => {
    const dayIso = suggestion.promotionDraft.startsAt;
    setListFocusDayIso(dayIso);
    setPageTab('list');
    showToast('Свободные окна в списке');
  }, [showToast]);

  const onSmartPromotionCreated = useCallback(async () => {
    if (useCabinetApi) {
      await reloadSlots();
    }
  }, [reloadSlots, useCabinetApi]);

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
    const primary = templateStartTimes[0] ?? startTime;
    if (primary) {
      setStartTime(primary);
      setEndTime(addMinutesToTime(primary, selectedTemplate.durationMinutes));
    }
  }, [manualMode, selectedTemplate, startTime, templateStartTimes]);

  useEffect(() => {
    if (manualMode || !selectedTemplate) return;
    setTemplateStartTimes((prev) => {
      const valid = filterValidTemplateStartTimes(prev, selectedTemplate.durationMinutes);
      return valid.length > 0 ? valid : ['12:00'];
    });
  }, [manualMode, selectedTemplate?.durationMinutes, selectedTemplate?.id]);

  const effectiveServiceId = useMemo(() => {
    if (selectedTemplate && !manualMode) return selectedTemplate.serviceId;
    const sid = serviceId.trim();
    return sid && isUuid(sid) ? sid : null;
  }, [manualMode, selectedTemplate, serviceId]);

  const templateModeActive = Boolean(selectedTemplate && !manualMode);

  const plannedSlots: PlannedSlot[] = useMemo(() => {
    const sid = effectiveServiceId;
    if (templateModeActive && selectedTemplate) {
      return buildPlannedSlots(dateIso, startTime, endTime, sid, repeatSettings, {
        templateStartTimes,
        durationMinutes: selectedTemplate.durationMinutes,
      });
    }
    return buildPlannedSlots(dateIso, startTime, endTime, sid, repeatSettings);
  }, [
    dateIso,
    effectiveServiceId,
    endTime,
    manualMode,
    repeatSettings,
    selectedTemplate,
    startTime,
    templateModeActive,
    templateStartTimes,
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
    if (templateModeActive && templateStartTimes.length > 0) {
      const timesLabel =
        templateStartTimes.length === 1
          ? `${templateStartTimes[0]}–${addMinutesToTime(templateStartTimes[0], selectedTemplate!.durationMinutes)}`
          : `${templateStartTimes.length} слота в день`;
      return `${name} · ${timesLabel}`;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return null;
    return `${name} · ${startTime}–${endTime}`;
  }, [
    effectiveServiceId,
    endTime,
    manualMode,
    selectedTemplate,
    startTime,
    templateModeActive,
    templateStartTimes,
    visibleServices,
  ]);

  const applyTemplate = useCallback(
    (id: string) => {
      setSelectedTemplateId(id);
      setManualMode(false);
      const tpl = templates.find((t) => t.id === id);
      if (tpl) {
        setServiceId(tpl.serviceId);
        setTemplateStartTimes((prev) => {
          const base = prev.length > 0 ? prev : [startTime || '12:00'];
          const valid = filterValidTemplateStartTimes(base, tpl.durationMinutes);
          return valid.length > 0 ? valid : ['12:00'];
        });
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
        setManualMode(templates.length === 0);
      }
      setAddSheetOpen(true);
    },
    [applyTemplate, templates.length],
  );

  const useManualAddWindow = useCallback(() => {
    setSelectedTemplateId(null);
    setManualMode(true);
    setServiceId('');
    setCreateError(null);
  }, []);

  const onTemplateStartTimesChange = useCallback(
    (times: string[]) => {
      setTemplateStartTimes(times);
      const first = times[0];
      if (!first) return;
      setStartTime(first);
      if (selectedTemplate) {
        setEndTime(addMinutesToTime(first, selectedTemplate.durationMinutes));
      }
    },
    [selectedTemplate],
  );

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
      if (templateStartTimes.length === 0) return 'Выберите хотя бы одно время начала.';
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
    templateStartTimes,
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
    if (!editWindow) return;
    if (editWindow.status === 'booked') {
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
    if (!editWindow) return;
    if (editWindow.status === 'booked') {
      showToast('На это окно есть запись — удалить нельзя');
      return;
    }
    setEditSaving(true);
    try {
      await removeSlot(editWindow.id);
      showToast('Окно удалено');
      setEditWindow(null);
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setEditSaving(false);
    }
  };

  const promoAside = (
    <SmartPromotionSuggestionsPanel
      state={smartPromo.state}
      dismissedIds={dismissedSuggestionIds}
      onDismiss={dismissSuggestion}
      onReload={smartPromo.reload}
      onViewWindows={onViewSuggestionWindows}
      onPromotionCreated={() => void onSmartPromotionCreated()}
      showToast={showToast}
      layout="sidebar"
    />
  );

  const promoStackMobile = (
    <div className="lg:hidden">
      <SmartPromotionSuggestionsPanel
        state={smartPromo.state}
        dismissedIds={dismissedSuggestionIds}
        onDismiss={dismissSuggestion}
        onReload={smartPromo.reload}
        onViewWindows={onViewSuggestionWindows}
        onPromotionCreated={() => void onSmartPromotionCreated()}
        showToast={showToast}
        layout="stack"
      />
    </div>
  );

  const tabPanels = (
    <>
      <AdminTabContentTransition activeKey={pageTab}>
        {pageTab === 'create' ? (
          <>
            {promoStackMobile}
            <div className={scheduleTabPanelShell}>
              <div className="lg:p-6">
                <ScheduleCreateTab
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onTemplateSelect={(id) => {
                    applyTemplate(id);
                    openAddSheet({ templateId: id });
                  }}
                  onTemplateMenu={setTemplateMenuTarget}
                  onCreateTemplate={() => setTemplateSheetOpen(true)}
                  onOpenWithoutTemplate={() => openAddSheet({ withoutTemplate: true })}
                  aside={promoAside}
                />
              </div>
            </div>
          </>
        ) : null}

        {pageTab === 'calendar' ? (
          <div className={scheduleTabPanelShell}>
            <div className="lg:p-6">
              <ScheduleCalendar
                windows={windows}
                loading={loading}
                slotStats={tabMetrics.calendar}
                onWindowClick={(w) => setEditWindow(w)}
              />
            </div>
          </div>
        ) : null}

        {pageTab === 'list' ? (
          <div className={scheduleTabPanelShell}>
            <div className="lg:p-6">
              <ScheduleSlotsListTab
                windows={windows}
                loading={loading}
                focusDayIso={listFocusDayIso}
                slotStats={tabMetrics.list}
                onWindowClick={(w) => setEditWindow(w)}
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
        className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 pb-[calc(5.75rem+1.25rem)] lg:hidden ${SCHEDULE_PAGE_BG}`}
      >
        <SchedulePageHeader activeTab={pageTab} metrics={tabMetrics} />
        {tabPanels}
      </section>

      <div className={`${scheduleShellCard} space-y-6`}>
        <div className={`${scheduleDesktopCard} ${scheduleDesktopTabsSticky}`}>
          <ScheduleSectionTabs active={pageTab} onChange={setPageTab} />
        </div>

        <div className="min-w-0 space-y-6">
          <SchedulePageHeader activeTab={pageTab} metrics={tabMetrics} />
          {tabPanels}
        </div>
      </div>

      <AddWindowSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        dateIso={dateIso}
        onDateIsoChange={setDateIso}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        templateStartTimes={templateStartTimes}
        onTemplateStartTimesChange={onTemplateStartTimesChange}
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
        <ServicesTabFab ariaLabel="Новое окно" onClick={() => openAddSheet()} />
      ) : null}

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

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}
