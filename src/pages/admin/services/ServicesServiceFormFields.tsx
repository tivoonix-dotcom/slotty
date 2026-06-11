import { useEffect, useState } from 'react';
import type { ServiceTemplate } from '../../../constants/serviceTemplates';
import { PopularServiceTemplatesChips } from '../../../features/catalog/PopularServiceTemplatesChips';
import { AdminSheetFieldLabel } from '../shared/AdminFormFieldLabel';
import { catalogSheetField, catalogSheetLabel } from '../shared/adminCatalogSheetTheme';
import { sheetLabelClass, sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import {
  servicesFormSegmentTrack,
  servicesSheetActionRow,
  servicesSheetErrorBox,
  servicesSheetFormPanel,
} from './adminServicesTheme';
import { ServicesFormSummary } from './ServicesFormSummary';
import { ServicesPhotoPlusIcon } from './ServicesPhotoPlusIcon';
import { ServicesSheetNotice } from './ServicesSheetNotice';
import { ServicesSheetPriceHero } from './ServicesSheetPriceHero';
import type { ServiceFormStep } from './serviceFormSteps';
import {
  ServiceCoverFramingEditor,
  type ServiceCoverDraft,
} from './ServiceCoverFramingEditor';

export type ServiceFormSheetMode = 'create' | 'full' | 'price';

type PriceType = 'fixed' | 'from';

type Props = {
  mode: ServiceFormSheetMode;
  open: boolean;
  step?: ServiceFormStep;
  stepError?: string | null;
  title: string;
  onTitleChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  priceType: PriceType;
  onPriceTypeChange: (value: PriceType) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  desc: string;
  onDescChange: (value: string) => void;
  durationMin: string;
  onDurationMinChange: (value: string) => void;
  formError: string | null;
  serviceCategoryCode: string | null | undefined;
  categoryLabel?: string | null;
  templateHighlightId: string | null;
  onApplyTemplate: (template: ServiceTemplate) => void;
  onClearTemplateHighlight: () => void;
  serviceTitlePlaceholder: string;
  cover: ServiceCoverDraft | null;
  onCoverChange: (next: ServiceCoverDraft | null) => void;
  coverUploading: boolean;
  onCoverUploadingChange: (uploading: boolean) => void;
  useCabinetApi: boolean;
};

function formatPricePreview(price: string, priceType: PriceType): string {
  const amount = price.replace(',', '.').trim();
  if (!amount) return '—';
  return `${priceType === 'from' ? 'от ' : ''}${amount} BYN`;
}

/** Поля формы услуги в catalog-bottom-sheet. */
export function ServicesServiceFormFields({
  mode,
  open,
  step = 0,
  stepError = null,
  title,
  onTitleChange,
  price,
  onPriceChange,
  priceType,
  onPriceTypeChange,
  isActive,
  onIsActiveChange,
  desc,
  onDescChange,
  durationMin,
  onDurationMinChange,
  formError,
  serviceCategoryCode,
  categoryLabel,
  templateHighlightId,
  onApplyTemplate,
  onClearTemplateHighlight,
  serviceTitlePlaceholder,
  cover,
  onCoverChange,
  coverUploading,
  onCoverUploadingChange,
  useCabinetApi,
}: Props) {
  const [descOpen, setDescOpen] = useState(false);
  const showCatalogFields = mode === 'create' || mode === 'full';
  const showPriceOnly = mode === 'price';
  const stepped = showCatalogFields;
  const inlineError = stepError ?? formError;
  const pricePreview = formatPricePreview(price, priceType);
  const priceTypeLabel = priceType === 'from' ? 'Цена от' : 'Точная цена';
  const visibilityLabel = isActive ? 'Видна' : 'Скрыта';

  useEffect(() => {
    if (!open) return;
    setDescOpen(Boolean(desc.trim()));
  }, [open, desc]);

  if (showPriceOnly) {
    return (
      <div className="space-y-3">
        {inlineError ? <ServicesSheetNotice tone="error" title={inlineError} /> : null}
        <ServicesSheetPriceHero label="Новая цена" value={pricePreview} />
        <div className={servicesSheetFormPanel}>
          <div className="rounded-[12px] bg-[#F5F5F5] px-3.5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Услуга</p>
            <p className="mt-1 text-[16px] font-bold tracking-[-0.02em] text-[#111827]">{title}</p>
          </div>
          <label className="mt-4 block">
            <AdminSheetFieldLabel required className={sheetLabelClass}>
              Цена, BYN
            </AdminSheetFieldLabel>
            <input
              value={price}
              onChange={(event) => onPriceChange(event.target.value)}
              inputMode="decimal"
              className={catalogSheetField}
              placeholder="45"
              autoFocus
            />
          </label>
          <div className="mt-4">
            <p className={catalogSheetLabel}>Тип цены</p>
            <div className={`mt-1.5 ${servicesFormSegmentTrack}`}>
              {(
                [
                  { id: 'fixed' as const, label: 'Точная цена' },
                  { id: 'from' as const, label: 'Цена от' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPriceTypeChange(item.id)}
                  className={sheetSegmentClass(priceType === item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepService = (
    <div className="space-y-3">
      <PopularServiceTemplatesChips
        collapsible
        collapsibleCompact
        variant="cabinet"
        categoryCode={serviceCategoryCode}
        categoryLabel={categoryLabel}
        selectedId={templateHighlightId}
        onSelect={onApplyTemplate}
      />
      <div className={servicesSheetFormPanel}>
        <label className="block">
          <p className={catalogSheetLabel}>Название услуги</p>
          <input
            value={title}
            onChange={(event) => {
              onTitleChange(event.target.value);
              onClearTemplateHighlight();
            }}
            className={`${catalogSheetField} mt-1.5`}
            placeholder={serviceTitlePlaceholder}
            autoFocus={mode === 'create' && step === 0}
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <p className={catalogSheetLabel}>Цена, BYN</p>
            <input
              value={price}
              onChange={(event) => onPriceChange(event.target.value)}
              inputMode="decimal"
              className={`${catalogSheetField} mt-1.5`}
              placeholder="45"
            />
          </label>
          <label className="block">
            <p className={catalogSheetLabel}>Длительность, мин</p>
            <input
              value={durationMin}
              onChange={(event) => onDurationMinChange(event.target.value)}
              inputMode="numeric"
              className={`${catalogSheetField} mt-1.5`}
              placeholder="60"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const stepCatalog = (
    <div className="space-y-3">
      <ServiceCoverFramingEditor
        value={cover}
        onChange={onCoverChange}
        uploading={coverUploading}
        onUploadingChange={onCoverUploadingChange}
        useCabinetApi={useCabinetApi}
        titlePreview={title}
        categoryLabel={categoryLabel}
        categoryCode={serviceCategoryCode}
        pricePreview={pricePreview}
      />

      <div className={servicesSheetFormPanel}>
        <div>
          <p className={catalogSheetLabel}>Тип цены</p>
          <div className={`mt-1.5 ${servicesFormSegmentTrack}`}>
            {(
              [
                { id: 'fixed' as const, label: 'Точная цена' },
                { id: 'from' as const, label: 'Цена от' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriceTypeChange(item.id)}
                className={sheetSegmentClass(priceType === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className={catalogSheetLabel}>Видимость</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
            Скрытые услуги не попадают в запись
          </p>
          <div className={`mt-2 ${servicesFormSegmentTrack}`}>
            <button
              type="button"
              onClick={() => onIsActiveChange(true)}
              className={sheetSegmentClass(isActive)}
            >
              Видна
            </button>
            <button
              type="button"
              onClick={() => onIsActiveChange(false)}
              className={sheetSegmentClass(!isActive)}
            >
              Скрыта
            </button>
          </div>
        </div>
      </div>

      <div className={servicesSheetFormPanel}>
        <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827]">Описание</p>
        <div className="mt-3">
          <div className={servicesSheetActionRow}>
            <button
              type="button"
              onClick={() => setDescOpen((value) => !value)}
              aria-expanded={descOpen}
              aria-label={
                descOpen ? 'Скрыть описание' : desc.trim() ? 'Изменить описание' : 'Добавить описание'
              }
              className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-1 text-left transition hover:bg-[#E4E4E4] active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[#111827]">
                  {desc.trim() ? 'Описание услуги' : 'Добавить описание'}
                </span>
                {desc.trim() && !descOpen ? (
                  <span className="mt-0.5 block truncate text-[13px] font-medium text-[#6B7280]">
                    {desc.trim()}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[13px] font-medium text-[#6B7280]">
                    Необязательно — что входит в услугу
                  </span>
                )}
              </span>
              <ServicesPhotoPlusIcon />
            </button>
          </div>

          {descOpen ? (
            <label className="mt-3 block">
              <span className="sr-only">Описание услуги</span>
              <textarea
                value={desc}
                onChange={(event) => onDescChange(event.target.value)}
                rows={3}
                className={`${catalogSheetField} resize-y`}
                placeholder="Например: снятие, обработка кутикулы, покрытие гель-лаком"
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );

  const stepReview = (
    <ServicesFormSummary
      title={title}
      priceLabel={pricePreview}
      durationLabel={`${durationMin || '—'} мин`}
      priceTypeLabel={priceTypeLabel}
      visibilityLabel={visibilityLabel}
      description={desc}
      categoryLabel={categoryLabel}
    />
  );

  const stepBody = stepped ? (step === 0 ? stepService : step === 1 ? stepCatalog : stepReview) : stepService;

  return (
    <div className="space-y-3">
      {inlineError && !stepError ? <ServicesSheetNotice tone="error" title={inlineError} /> : null}
      {stepError ? <p className={servicesSheetErrorBox}>{stepError}</p> : null}
      {stepBody}
    </div>
  );
}
