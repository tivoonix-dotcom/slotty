import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout, AdminFormSheetStepper } from '../shared/AdminFormSheetLayout';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import { servicesSheetPrimaryBtn, servicesSheetSecondaryBtn } from './adminServicesTheme';
import { ServicesSheetPrimaryButton } from './ServicesSheetPrimaryButton';
import {
  SERVICE_FORM_STEPS,
  validateServiceFormAll,
  validateServiceFormStep,
  type ServiceFormStep,
} from './serviceFormSteps';
import type { ServiceFormSheetMode } from './ServicesServiceFormFields';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  mode: ServiceFormSheetMode;
  busy: boolean;
  saveLabel: string;
  onSave: () => void;
  titleValue: string;
  price: string;
  durationMin: string;
  coverImageUrl: string;
  coverUploading: boolean;
  children: (args: { step: ServiceFormStep; stepError: string | null }) => ReactNode;
};

export function ServicesServiceSheet({
  open,
  onClose,
  title,
  subtitle,
  mode,
  busy,
  saveLabel,
  onSave,
  titleValue,
  price,
  durationMin,
  coverImageUrl,
  coverUploading,
  children,
}: Props) {
  const stepped = mode === 'create' || mode === 'full';
  const [step, setStep] = useState<ServiceFormStep>(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const stepCtx = useMemo(
    () => ({ title: titleValue, price, durationMin, coverImageUrl, coverUploading }),
    [coverImageUrl, coverUploading, durationMin, price, titleValue],
  );

  useEffect(() => {
    if (open) {
      setStep(0);
      setStepError(null);
    }
  }, [open]);

  useEffect(() => {
    setStepError(null);
  }, [step, titleValue, price, durationMin, coverImageUrl, coverUploading]);

  const handleNext = () => {
    const err = validateServiceFormStep(step, stepCtx);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (step < 2) setStep((value) => (value + 1) as ServiceFormStep);
  };

  const handleBack = () => {
    setStepError(null);
    if (step > 0) setStep((value) => (value - 1) as ServiceFormStep);
  };

  const handleSave = () => {
    const err0 = validateServiceFormStep(0, stepCtx);
    if (err0) {
      setStep(0);
      setStepError(err0);
      return;
    }
    const err1 = validateServiceFormStep(1, stepCtx);
    if (err1) {
      setStep(1);
      setStepError(err1);
      return;
    }
    const errAll = validateServiceFormAll(stepCtx);
    if (errAll) {
      setStepError(errAll);
      return;
    }
    setStepError(null);
    onSave();
  };

  const footer = stepped ? (
    step < 2 ? (
      <div className="flex w-full gap-3">
        {step > 0 ? (
          <button type="button" className={servicesSheetSecondaryBtn} disabled={busy} onClick={handleBack}>
            Назад
          </button>
        ) : (
          <button type="button" className={servicesSheetSecondaryBtn} disabled={busy} onClick={onClose}>
            Отмена
          </button>
        )}
        <button type="button" className={servicesSheetPrimaryBtn} disabled={busy} onClick={handleNext}>
          Далее
        </button>
      </div>
    ) : (
      <div className="flex w-full gap-3">
        <button type="button" className={servicesSheetSecondaryBtn} disabled={busy} onClick={handleBack}>
          Назад
        </button>
        <ServicesSheetPrimaryButton disabled={busy} onClick={handleSave} className="flex-1">
          {busy ? 'Сохранение…' : saveLabel}
        </ServicesSheetPrimaryButton>
      </div>
    )
  ) : (
    <div className="flex w-full gap-3">
      <button type="button" onClick={onClose} disabled={busy} className={catalogSheetSecondaryBtn}>
        Отмена
      </button>
      <ServicesSheetPrimaryButton disabled={busy} onClick={onSave} className="flex-1">
        {busy ? 'Сохранение…' : saveLabel}
      </ServicesSheetPrimaryButton>
    </div>
  );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      headerAfter={
        stepped ? (
          <AdminFormSheetStepper
            step={step}
            steps={[...SERVICE_FORM_STEPS]}
            variant="catalog"
            accent="brand"
          />
        ) : undefined
      }
      footer={footer}
    >
      <AdminFormSheetLayout>
        {children({ step, stepError })}
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
