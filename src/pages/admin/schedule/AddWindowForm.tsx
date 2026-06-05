import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import { catalogSheetLabel } from '../shared/adminCatalogSheetTheme';
import { scheduleSheetErrorBox } from './adminScheduleTheme';
import type { PlannedSlot, WindowTemplate } from './scheduleTypes';
import { errorBoxClass } from './scheduleTypes';
import {
  durationMinutesBetween,
  formatDurationRu,
  serviceTitleById,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { labelClass, primaryBtnClass, secondaryBtnClass } from './scheduleUi';
import { RepeatSettings, type RepeatSettingsValue } from './RepeatSettings';
import { SchedulePreview } from './SchedulePreview';
import { AddWindowFormSummary } from './AddWindowFormSummary';
import type { AddWindowFormStep } from './addWindowFormSteps';

type Props = {
  variant?: 'sheet';
  step: AddWindowFormStep;
  dateIso: string;
  onDateIsoChange: (v: string) => void;
  startTime: string;
  onStartTimeChange: (v: string) => void;
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

export function AddWindowForm({
  variant,
  step,
  dateIso,
  onDateIsoChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  manualMode,
  onManualModeChange: _onManualModeChange,
  serviceId,
  onServiceIdChange,
  selectedTemplateId,
  onTemplateSelect: _onTemplateSelect,
  onUseManualMode: _onUseManualMode,
  onUseTemplateMode: _onUseTemplateMode,
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
  const fieldLabel = inSheet ? catalogSheetLabel : labelClass;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const durationMin = durationMinutesBetween(startTime, endTime);
  const serviceLabel =
    summaryLine?.split(' · ')[0] ??
    serviceTitleById(services, serviceId && isUuid(serviceId) ? serviceId : null);

  const inlineError = stepError ?? createError;
  const sheetSection = inSheet ? ({ variant: 'catalog' as const }) : {};
  const metaHintClass = 'mt-2 text-[13px] font-medium text-[#6B7280]';

  const stepWhen = (
    <div className="space-y-4">
      <AdminFormSheetSection
        title="День записи"
        description={inSheet ? undefined : 'Дата, когда слот появится в расписании'}
        {...sheetSection}
      >
        <div>
          <p className={fieldLabel}>Дата</p>
          <SlottyDatePicker
            className="mt-1.5 w-full"
            tone="admin"
            value={dateIso}
            onChange={onDateIsoChange}
            sheetTitle="День записи"
            sheetSubtitle="Дата слота"
          />
        </div>
      </AdminFormSheetSection>

      <AdminFormSheetSection
        title="Начало"
        description={inSheet ? undefined : 'Во сколько начинается приём'}
        {...sheetSection}
      >
        <div>
          <p className={fieldLabel}>Время начала</p>
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

      <AdminFormSheetSection
        title="Окончание"
        description={inSheet ? undefined : 'Когда слот закрывается для новых записей'}
        {...sheetSection}
      >
        <div>
          <p className={fieldLabel}>Время окончания</p>
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
            <p className={metaHintClass}>Длительность: {formatDurationRu(durationMin)}</p>
          ) : startTime && endTime && durationMin <= 0 ? (
            <p className="mt-2 text-[13px] font-semibold text-[#DC2626]">
              Окончание должно быть позже начала
            </p>
          ) : null}
        </div>
      </AdminFormSheetSection>
    </div>
  );

  const stepService = (
    <div className="space-y-4">
      <AdminFormSheetSection
        title="Услуга"
        description={inSheet ? undefined : 'Что увидит клиент при записи'}
        {...sheetSection}
      >
        <div>
          <p className={fieldLabel}>Услуга в каталоге</p>
          <SlottySelect
            className="mt-1.5 w-full"
            tone="admin"
            value={serviceId}
            onChange={onServiceIdChange}
            options={serviceOptions}
            aria-label="Услуга"
          />
          {!inSheet ? (
            <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">
              «Любая услуга» — клиент выберет из вашего каталога при записи.
            </p>
          ) : null}
        </div>
      </AdminFormSheetSection>

      {serviceOptions.length <= 1 ? (
        <p className="text-[14px] font-medium text-[#6B7280]">
          <Link
            to={ADMIN_SERVICES_PATH}
            className={inSheet ? 'font-semibold text-[#111827] underline' : 'font-semibold text-[#3B4CCA]'}
          >
            Добавьте услуги
          </Link>
          , чтобы привязать окно к позиции в каталоге.
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
        description={inSheet ? undefined : 'Серия окон на несколько недель'}
        {...sheetSection}
      >
        <RepeatSettings
          value={repeatSettings}
          onChange={onRepeatSettingsChange}
          dateIso={dateIso}
          cabinet={inSheet}
        />
      </AdminFormSheetSection>

      {plannedSlots.length > 0 ? (
        <AdminFormSheetSection
          title="Список окон"
          description={inSheet ? undefined : 'Такие слоты появятся в расписании'}
          {...sheetSection}
        >
          <SchedulePreview
            slots={plannedSlots}
            services={services}
            creatableCount={creatableCount}
            serviceName={serviceLabel}
            beyondHorizon={beyondHorizon}
            horizonDays={horizonDays}
            cabinet={inSheet}
          />
        </AdminFormSheetSection>
      ) : null}
    </div>
  );

  const stepBody = step === 0 ? stepWhen : step === 1 ? stepService : stepReview;

  if (inSheet) {
    return (
      <>
        {stepBody}
        {inlineError ? <p className={scheduleSheetErrorBox}>{inlineError}</p> : null}
      </>
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
