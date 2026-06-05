import { useEffect, useMemo, useState } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout, AdminFormSheetStepper } from '../shared/AdminFormSheetLayout';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import { scheduleSheetGhostBtn, scheduleSheetPrimaryBtn } from './adminScheduleTheme';
import { AddWindowForm } from './AddWindowForm';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { PlannedSlot, WindowTemplate } from './scheduleTypes';
import type { RepeatSettingsValue } from './RepeatSettings';
import { windowsCountRu } from './scheduleUtils';
import {
  ADD_WINDOW_FORM_STEPS,
  isAddWindowTemplateMode,
  validateAddWindowStep,
  type AddWindowFormStep,
} from './addWindowFormSteps';

type Props = {
  open: boolean;
  onClose: () => void;
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
  saving: boolean;
  onSubmit: () => void;
};

export function AddWindowSheet({ open, onClose, createError, ...form }: Props) {
  const { onSubmit, saving, creatableCount, selectedTemplateId, templates, manualMode, ...rest } = form;

  const [step, setStep] = useState<AddWindowFormStep>(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const stepCtx = useMemo(
    () => ({
      dateIso: form.dateIso,
      startTime: form.startTime,
      endTime: form.endTime,
      serviceId: form.serviceId,
      manualMode,
      selectedTemplate,
      repeatSettings: form.repeatSettings,
    }),
    [
      form.dateIso,
      form.endTime,
      form.repeatSettings,
      form.serviceId,
      form.startTime,
      manualMode,
      selectedTemplate,
    ],
  );

  const templateMode = isAddWindowTemplateMode({ manualMode, selectedTemplate });
  const stepperSteps = templateMode ? (['Когда', 'Проверка'] as const) : ADD_WINDOW_FORM_STEPS;
  const stepperIndex = templateMode ? (step === 2 ? 1 : 0) : step;

  useEffect(() => {
    if (open) {
      setStep(0);
      setStepError(null);
    }
  }, [open]);

  useEffect(() => {
    setStepError(null);
  }, [
    step,
    form.dateIso,
    form.startTime,
    form.endTime,
    form.serviceId,
    form.repeatSettings,
    manualMode,
    selectedTemplateId,
  ]);

  const submitLabel =
    creatableCount <= 1
      ? 'Добавить окно'
      : `Добавить ${windowsCountRu(creatableCount)}`;

  const handleNext = () => {
    const err = validateAddWindowStep(step, stepCtx);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (step === 0 && templateMode) {
      setStep(2);
      return;
    }
    if (step < 2) setStep((s) => (s + 1) as AddWindowFormStep);
  };

  const handleBack = () => {
    setStepError(null);
    if (step === 2 && templateMode) {
      setStep(0);
      return;
    }
    if (step > 0) setStep((s) => (s - 1) as AddWindowFormStep);
  };

  const handleSubmit = () => {
    const err0 = validateAddWindowStep(0, stepCtx);
    const err2 = validateAddWindowStep(2, stepCtx);
    if (err0) {
      setStep(0);
      setStepError(err0);
      return;
    }
    if (!templateMode) {
      const err1 = validateAddWindowStep(1, stepCtx);
      if (err1) {
        setStep(1);
        setStepError(err1);
        return;
      }
    }
    if (err2) {
      setStep(2);
      setStepError(err2);
      return;
    }
    setStepError(null);
    onSubmit();
  };

  const footer =
    step < 2 ? (
      <div className="flex flex-col gap-2">
        <div className="flex w-full gap-3">
          {step > 0 ? (
            <button type="button" className={catalogSheetSecondaryBtn} disabled={saving} onClick={handleBack}>
              Назад
            </button>
          ) : null}
          <button type="button" className={scheduleSheetPrimaryBtn} disabled={saving} onClick={handleNext}>
            Далее
          </button>
        </div>
        <button type="button" className={catalogSheetSecondaryBtn} disabled={saving} onClick={onClose}>
          Отмена
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={scheduleSheetPrimaryBtn}
          disabled={saving || creatableCount === 0}
          onClick={handleSubmit}
        >
          {saving ? 'Сохранение…' : submitLabel}
        </button>
        <button type="button" className={scheduleSheetGhostBtn} disabled={saving} onClick={handleBack}>
          Назад
        </button>
      </div>
    );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Новое окно"
      headerAfter={
        <AdminFormSheetStepper step={stepperIndex} steps={[...stepperSteps]} variant="catalog" accent="schedule" />
      }
      footer={footer}
    >
      <AdminFormSheetLayout>
        <AddWindowForm
          {...rest}
          variant="sheet"
          step={step}
          manualMode={manualMode}
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={form.onTemplateSelect}
          onUseManualMode={form.onUseManualMode}
          onUseTemplateMode={form.onUseTemplateMode}
          templates={templates}
          saving={saving}
          creatableCount={creatableCount}
          createError={createError}
          stepError={stepError}
          onSubmit={handleSubmit}
        />
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
