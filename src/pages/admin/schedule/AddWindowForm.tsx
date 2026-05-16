import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import type { PlannedSlot, RepeatKind, WindowTemplate } from './scheduleTypes';
import { errorBoxClass } from './scheduleTypes';
import { serviceTitleById, windowsCountRu } from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { cardClass, labelClass, primaryBtnClass } from './scheduleUi';
import { RepeatSettings, type RepeatCount } from './RepeatSettings';
import { SchedulePreview } from './SchedulePreview';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
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
  templates: WindowTemplate[];
  onCreateTemplate: () => void;
  services: MasterOnboardingService[];
  serviceOptions: { value: string; label: string }[];
  repeatKind: RepeatKind;
  onRepeatKindChange: (k: RepeatKind) => void;
  repeatCount: RepeatCount;
  onRepeatCountChange: (n: RepeatCount) => void;
  plannedSlots: PlannedSlot[];
  creatableCount: number;
  beyondHorizon: number;
  horizonDays: number | null;
  summaryLine: string | null;
  createError: string | null;
  saving: boolean;
  onSubmit: () => void;
};

export function AddWindowForm({
  dateIso,
  onDateIsoChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  manualMode,
  onManualModeChange,
  serviceId,
  onServiceIdChange,
  selectedTemplateId,
  onTemplateSelect,
  templates,
  onCreateTemplate,
  services,
  serviceOptions,
  repeatKind,
  onRepeatKindChange,
  repeatCount,
  onRepeatCountChange,
  plannedSlots,
  creatableCount,
  beyondHorizon,
  horizonDays,
  summaryLine,
  createError,
  saving,
  onSubmit,
}: Props) {
  const timeOptions = mergeScheduleTimeSelectOptions(startTime, endTime);

  const submitLabel =
    creatableCount <= 1
      ? 'Добавить окно'
      : `Добавить окна (${windowsCountRu(creatableCount)})`;

  return (
    <div className="space-y-5">
      <WindowTemplateList
        templates={templates}
        selectedId={selectedTemplateId}
        onSelect={onTemplateSelect}
        onCreate={onCreateTemplate}
      />

      <section className={cardClass}>
        <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950">Новое окно</h3>
        <p className="mt-1 text-[13px] text-neutral-500">
          Выбери шаблон, и длительность подставится автоматически
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className={labelClass}>Дата</p>
            <SlottyDatePicker className="mt-1.5 w-full" value={dateIso} onChange={onDateIsoChange} />
          </div>

          <div>
            <p className={labelClass}>Время начала</p>
            <SlottySelect
              className="mt-1.5 w-full"
              value={startTime}
              onChange={onStartTimeChange}
              options={timeOptions}
              aria-label="Время начала"
            />
          </div>

          {manualMode ? (
            <>
              <div>
                <p className={labelClass}>Услуга</p>
                <SlottySelect
                  className="mt-1.5 w-full"
                  value={serviceId}
                  onChange={onServiceIdChange}
                  options={serviceOptions}
                  aria-label="Услуга"
                />
              </div>
              <div>
                <p className={labelClass}>Время окончания</p>
                <SlottySelect
                  className="mt-1.5 w-full"
                  value={endTime}
                  onChange={onEndTimeChange}
                  options={timeOptions}
                  aria-label="Время окончания"
                />
              </div>
            </>
          ) : (
            <div className="rounded-[20px] bg-[#F1EFEF] px-4 py-3">
              <p className="text-[12px] font-semibold text-neutral-500">Итог</p>
              <p className="mt-1 text-[15px] font-semibold text-neutral-900">
                {summaryLine ?? 'Выберите шаблон или укажите услугу вручную'}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onManualModeChange(!manualMode)}
            className="text-[13px] font-semibold text-[#C97B7B]"
          >
            {manualMode ? 'Использовать шаблон' : 'Указать услугу и время вручную'}
          </button>

          <RepeatSettings
            repeatKind={repeatKind}
            onRepeatKindChange={onRepeatKindChange}
            repeatCount={repeatCount}
            onRepeatCountChange={onRepeatCountChange}
          />

          {plannedSlots.length > 0 ? (
            <SchedulePreview
              slots={plannedSlots}
              services={services}
              serviceName={
                selectedTemplateId
                  ? templates.find((t) => t.id === selectedTemplateId)?.serviceName
                  : serviceTitleById(services, serviceId && isUuid(serviceId) ? serviceId : null)
              }
              beyondHorizon={beyondHorizon}
              horizonDays={horizonDays}
            />
          ) : null}

          {createError ? <p className={errorBoxClass}>{createError}</p> : null}

          {serviceOptions.length <= 1 && !manualMode ? (
            <p className="text-[13px] text-neutral-500">
              <Link to={ADMIN_SERVICES_PATH} className="font-semibold text-[#C97B7B]">
                Добавьте услуги
              </Link>
              , чтобы создавать шаблоны.
            </p>
          ) : null}

          <button
            type="button"
            className={primaryBtnClass}
            disabled={saving || creatableCount === 0}
            onClick={onSubmit}
          >
            {saving ? 'Сохранение…' : submitLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
