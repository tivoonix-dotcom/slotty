import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import { adminFormSheetHighlight, adminFormSheetInsetTray } from '../shared/adminFormSheetTheme';
import type { PlannedSlot, WindowTemplate } from './scheduleTypes';
import { errorBoxClass } from './scheduleTypes';
import {
  addMinutesToTime,
  durationMinutesBetween,
  formatDurationRu,
  serviceTitleById,
  templateDisplayLabel,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { labelClass, primaryBtnClass, secondaryBtnClass } from './scheduleUi';
import { RepeatSettings, type RepeatSettingsValue } from './RepeatSettings';
import { SchedulePreview } from './SchedulePreview';
import { AddWindowFormSummary } from './AddWindowFormSummary';
import { AddWindowModeSwitch } from './AddWindowModeSwitch';
import { AddWindowTemplatePicker } from './AddWindowTemplatePicker';
import { TemplateStartTimesPicker } from './TemplateStartTimesPicker';
import type { AddWindowFormStep } from './addWindowFormSteps';
import { isAddWindowTemplateMode } from './addWindowFormSteps';
import { HiPencilSquare } from 'react-icons/hi2';

type Props = {
  variant?: 'sheet';
  step: AddWindowFormStep;
  dateIso: string;
  onDateIsoChange: (v: string) => void;
  startTime: string;
  onStartTimeChange: (v: string) => void;
  templateStartTimes: string[];
  onTemplateStartTimesChange: (times: string[]) => void;
  endTime: string;
  onEndTimeChange: (v: string) => void;
  manualMode: boolean;
  onManualModeChange: (v: boolean) => void;
  serviceId: string;
  onServiceIdChange: (v: string) => void;
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  onUseManualMode: () => void;
  onUseTemplateMode: () => void;
  templates: WindowTemplate[];
  services: MasterOnboardingService[];
  serviceOptions: { value: string; label: string }[];
  repeatSettings: RepeatSettingsValue;
  onRepeatSettingsChange: (v: RepeatSettingsValue) => void;
  plannedSlots: PlannedSlot[];
  creatableCount: number;
  beyondHorizon: number;
  horizonDays: number | null;
  summaryLine: string | null;
  createError: string | null;
  stepError: string | null;
  saving: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
};

function HintCard({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-[18px] border border-[#FDE8ED] bg-[#FFF9FB] px-4 py-3">
      <p className="text-[12px] font-bold text-[#ff5f7a]">{title}</p>
      <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#6B7280]">{children}</p>
    </div>
  );
}

export function AddWindowForm({
  variant,
  step,
  dateIso,
  onDateIsoChange,
  startTime,
  onStartTimeChange,
  templateStartTimes,
  onTemplateStartTimesChange,
  endTime,
  onEndTimeChange,
  manualMode,
  onManualModeChange,
  serviceId,
  onServiceIdChange,
  selectedTemplateId,
  onTemplateSelect,
  onUseManualMode,
  onUseTemplateMode,
  templates,
  services,
  serviceOptions,
  repeatSettings,
  onRepeatSettingsChange,
  plannedSlots,
  creatableCount,
  beyondHorizon,
  horizonDays,
  summaryLine,
  createError,
  stepError,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const timeOptions = mergeScheduleTimeSelectOptions(startTime, endTime);
  const inSheet = variant === 'sheet';
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const hasTemplates = templates.length > 0;
  const templateMode = isAddWindowTemplateMode({ manualMode, selectedTemplate });
  const showTemplateFlow = hasTemplates && !manualMode;
  const durationMin = durationMinutesBetween(startTime, endTime);
  const serviceLabel =
    summaryLine?.split(' · ')[0] ??
    (templateMode && selectedTemplate
      ? templateDisplayLabel(selectedTemplate)
      : serviceTitleById(services, serviceId && isUuid(serviceId) ? serviceId : null));

  const inlineError = stepError ?? createError;

  const stepWhen = (
    <div className="space-y-4">
      <AdminFormSheetSection
        title="День записи"
        description="Дата, когда слот появится в расписании"
      >
        <div>
          <p className={labelClass}>Дата</p>
          <SlottyDatePicker
            className="mt-1.5 w-full"
            tone="admin"
            value={dateIso}
            onChange={onDateIsoChange}
            sheetTitle="День записи"
            sheetSubtitle="Дата, когда слот появится в расписании"
          />
        </div>
      </AdminFormSheetSection>

      {hasTemplates ? (
        <AdminFormSheetSection
          title="Как создать"
          description="Шаблон — быстрее; вручную — своя услуга и длительность"
        >
          <AddWindowModeSwitch
            mode={manualMode ? 'manual' : 'template'}
            onTemplate={onUseTemplateMode}
            onManual={onUseManualMode}
          />
        </AdminFormSheetSection>
      ) : null}

      {showTemplateFlow ? (
        <>
          <AdminFormSheetSection
            title="Шаблон"
            description="Услуга и длительность — из сохранённого шаблона"
          >
            <AddWindowTemplatePicker
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={onTemplateSelect}
            />
          </AdminFormSheetSection>

          {selectedTemplate ? (
            <AdminFormSheetSection
              title="Время в этот день"
              description="Можно несколько — на каждое создастся отдельное окно"
            >
              <TemplateStartTimesPicker
                selected={templateStartTimes}
                durationMinutes={selectedTemplate.durationMinutes}
                onChange={onTemplateStartTimesChange}
              />
              <div className={`mt-4 ${adminFormSheetHighlight}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  {templateDisplayLabel(selectedTemplate)}
                </p>
                <p className="mt-2 text-[14px] font-semibold text-[#374151]">{selectedTemplate.serviceName}</p>
                {templateStartTimes.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {templateStartTimes.map((t) => (
                      <li
                        key={t}
                        className="text-[13px] font-bold tabular-nums text-[#111827]"
                      >
                        {t}–{addMinutesToTime(t, selectedTemplate.durationMinutes)}
                        <span className="ml-2 font-semibold text-[#9CA3AF]">
                          · {formatDurationRu(selectedTemplate.durationMinutes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] font-semibold text-[#6B7280]">
                    Длительность {formatDurationRu(selectedTemplate.durationMinutes)}
                  </p>
                )}
              </div>
            </AdminFormSheetSection>
          ) : null}
        </>
      ) : (
        <>
          <AdminFormSheetSection title="Начало" description="Во сколько начинается приём">
            <div>
              <p className={labelClass}>Время начала</p>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={startTime}
                onChange={onStartTimeChange}
                options={timeOptions}
                aria-label="Время начала"
                sheetTitle="Время начала"
                sheetSubtitle="Во сколько начинается приём"
              />
            </div>
          </AdminFormSheetSection>

          <AdminFormSheetSection title="Окончание" description="Когда слот закрывается для новых записей">
            <div>
              <p className={labelClass}>Время окончания</p>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={endTime}
                onChange={onEndTimeChange}
                options={timeOptions}
                aria-label="Время окончания"
                sheetTitle="Время окончания"
                sheetSubtitle="Когда заканчивается приём"
              />
              {startTime && endTime && durationMin > 0 ? (
                <p className="mt-2 text-[13px] font-bold text-[#ff5f7a]">
                  Длительность: {formatDurationRu(durationMin)}
                </p>
              ) : startTime && endTime && durationMin <= 0 ? (
                <p className="mt-2 text-[13px] font-semibold text-[#DC2626]">
                  Окончание должно быть позже начала
                </p>
              ) : null}
            </div>
          </AdminFormSheetSection>
        </>
      )}
    </div>
  );

  const stepService = (
    <div className="space-y-4">
      {templateMode && selectedTemplate ? (
        <>
          <div className={`${adminFormSheetHighlight} border border-[#FDE8ED]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Из шаблона</p>
            <p className="mt-2 text-[18px] font-black tracking-[-0.04em] text-[#111827]">
              {templateDisplayLabel(selectedTemplate)}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              {selectedTemplate.serviceName} · {formatDurationRu(selectedTemplate.durationMinutes)}
            </p>
            <p className="mt-3 text-[13px] font-semibold text-[#374151]">
              Услуга и длительность заданы на шаге «Когда». Отдельно выбирать услугу не нужно.
            </p>
            <button
              type="button"
              onClick={() => onManualModeChange(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#FDE8ED] bg-white py-2.5 text-[13px] font-bold text-[#ff5f7a] transition hover:bg-[#FFF9FB] active:scale-[0.98]"
            >
              <HiPencilSquare className="h-4 w-4" aria-hidden />
              Другая услуга или своё время
            </button>
          </div>
          <HintCard title="Далее — проверка">
            На следующем шаге можно включить повтор и посмотреть список окон перед сохранением.
          </HintCard>
        </>
      ) : (
        <>
          <HintCard title="Услуга">
            Показывается клиенту при записи. День и время слота вы уже задали на предыдущем шаге.
          </HintCard>

          <AdminFormSheetSection title="Услуга" description="Что увидит клиент при записи">
            <div>
              <p className={labelClass}>Услуга в каталоге</p>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={serviceId}
                onChange={onServiceIdChange}
                options={serviceOptions}
                aria-label="Услуга"
              />
              <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">
                «Любая услуга» — клиент выберет из вашего каталога при записи.
              </p>
            </div>
          </AdminFormSheetSection>

          {selectedTemplate ? (
            <button
              type="button"
              onClick={() => onManualModeChange(false)}
              className="text-[13px] font-bold text-[#ff5f7a]"
            >
              ← Вернуться к шаблону
            </button>
          ) : null}
        </>
      )}

      {serviceOptions.length <= 1 ? (
        <p className="text-[13px] font-semibold text-[#6B7280]">
          <Link to={ADMIN_SERVICES_PATH} className="font-bold text-[#ff5f7a]">
            Добавьте услуги
          </Link>
          , чтобы привязать окно к конкретной позиции в каталоге.
        </p>
      ) : null}
    </div>
  );

  const stepReview = (
    <div className="space-y-4">
      <AddWindowFormSummary
        dateIso={dateIso}
        startTime={startTime}
        endTime={endTime}
        serviceLabel={serviceLabel}
        selectedTemplate={selectedTemplate}
        manualMode={manualMode}
        repeatSettings={repeatSettings}
        creatableCount={creatableCount}
        totalPlanned={plannedSlots.length}
      />

      <AdminFormSheetSection
        title="Повтор"
        description="Серия окон на несколько недель — необязательно"
      >
        <RepeatSettings
          value={repeatSettings}
          onChange={onRepeatSettingsChange}
          dateIso={dateIso}
        />
      </AdminFormSheetSection>

      {plannedSlots.length > 0 ? (
        <AdminFormSheetSection title="Список окон" description="Такие слоты появятся в расписании">
          <div className={inSheet ? adminFormSheetInsetTray : undefined}>
            <SchedulePreview
              slots={plannedSlots}
              services={services}
              creatableCount={creatableCount}
              serviceName={serviceLabel}
              beyondHorizon={beyondHorizon}
              horizonDays={horizonDays}
            />
          </div>
        </AdminFormSheetSection>
      ) : null}

      <ul className="space-y-2 rounded-[18px] border border-[#FDE8ED] bg-[#f6f7fb] px-4 py-3 text-[13px] font-semibold text-[#6B7280]">
        <li>· Окно появится во вкладках «Календарь» и «Окна»</li>
        <li>· Клиенты смогут записаться, пока статус «Свободно»</li>
        <li>· Пересечения с другими слотами будут пропущены автоматически</li>
      </ul>
    </div>
  );

  const stepBody = step === 0 ? stepWhen : step === 1 ? stepService : stepReview;

  if (inSheet) {
    return (
      <div className="space-y-4">
        {stepBody}
        {inlineError ? <p className={errorBoxClass}>{inlineError}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stepBody}
      {inlineError ? <p className={errorBoxClass}>{inlineError}</p> : null}
      <div className="space-y-2">
        <button
          type="button"
          className={primaryBtnClass}
          disabled={saving || creatableCount === 0}
          onClick={onSubmit}
        >
          {saving ? 'Сохранение…' : 'Добавить'}
        </button>
        {onCancel ? (
          <button type="button" className={secondaryBtnClass} disabled={saving} onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </div>
  );
}
