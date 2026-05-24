import { useEffect, useMemo, useState } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetStepper } from '../shared/AdminFormSheetLayout';
import { adminSheetBodyPad, adminSheetGhostBtn, adminSheetPinkBtn, adminSheetSecondaryBtn } from '../shared/adminCabinetSheetTheme';
import { AddWindowForm } from './AddWindowForm';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { PlannedSlot, WindowTemplate } from './scheduleTypes';
import type { RepeatSettingsValue } from './RepeatSettings';
import { windowsCountRu } from './scheduleUtils';
import {
  ADD_WINDOW_FORM_STEPS,
  getAddWindowStepSubtitle,
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
      templateStartTimes: form.templateStartTimes,
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
      form.templateStartTimes,
      manualMode,
      selectedTemplate,
    ],
  );

  const templateMode = isAddWindowTemplateMode({ manualMode, selectedTemplate });
  const stepperSteps = templateMode ? (['Когда', 'Проверка'] as const) : ADD_WINDOW_FORM_STEPS;
  const stepperIndex = templateMode ? (step === 2 ? 1 : 0) : step;
  const stepSubtitle = getAddWindowStepSubtitle(step, stepCtx);

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
    form.templateStartTimes,
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
        <button
          type="button"
          className={adminSheetPinkBtn}
          disabled={saving}
          onClick={handleNext}
        >
          Далее
        </button>
        <div className="flex gap-2">
          {step > 0 ? (
            <button type="button" className={`${adminSheetGhostBtn} flex-1`} disabled={saving} onClick={handleBack}>
              Назад
            </button>
          ) : null}
          <button
            type="button"
            className={`${step > 0 ? adminSheetGhostBtn : adminSheetSecondaryBtn} flex-1`}
            disabled={saving}
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={adminSheetPinkBtn}
          disabled={saving || creatableCount === 0}
          onClick={handleSubmit}
        >
          {saving ? 'Сохранение…' : submitLabel}
        </button>
        <button type="button" className={adminSheetGhostBtn} disabled={saving} onClick={handleBack}>
          Назад
        </button>
      </div>
    );

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="Новое окно"
      headerContent={
        <div className="space-y-4">
          <h2
            id="admin-sheet-title"
            className="pb-1 text-[20px] font-black leading-tight tracking-[-0.04em] text-[#111827] lg:pb-1.5 lg:text-[22px]"
          >
            Новое окно
          </h2>
          <AdminFormSheetStepper variant="header" step={stepperIndex} steps={[...stepperSteps]} />
          <p className="text-[13px] font-semibold leading-relaxed text-[#6B7280] lg:text-[14px]">
            {stepSubtitle}
          </p>
        </div>
      }
      footer={footer}
    >
      <div className={`${adminSheetBodyPad} space-y-5 lg:space-y-6`}>
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
      </div>
    </AdminBottomSheet>
  );
}
