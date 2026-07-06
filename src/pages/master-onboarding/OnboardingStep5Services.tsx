import { useMemo } from 'react';
import type { ServiceTemplate } from '../../constants/serviceTemplates';
import type { DemoMasterService } from '../../features/services/model/demoMasters';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import { managedServiceToClientPreview } from '../../features/admin/lib/managedServiceToClientPreview';
import { PopularServiceTemplatesChips } from '../../features/catalog/PopularServiceTemplatesChips';
import { MasterServicesList } from '../client/masterProfile/MasterServicesList';
import { serviceDurationLabel } from '../client/masterProfile/masterProfileUtils';
import { catalogCanvasClass } from '../client/masterProfile/masterProfileTheme';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import { AdminFormSheetSection } from '../admin/shared/AdminFormSheetLayout';
import {
  sheetCancelBtnClass,
  sheetFieldClass,
  sheetHintClass,
  sheetLabelClass,
  sheetPrimaryBtnClass,
  sheetSegmentClass,
} from '../admin/profile/adminProfileCabinetTheme';
import {
  onboardingEyebrowClass,
  onboardingFieldScrollClass,
  onboardingStepTitleClass,
} from './onboardingFormField';
import {
  countActiveOnboardingServices,
  formatOnboardingServicePrice,
  exceedsFreeActiveServiceLimit,
  onboardingServicesListDescription,
} from './onboardingServiceUtils';
import { ONBOARDING_PLAN_COPY } from './onboardingPlanCopy';

const sheetSegmentWrap = 'grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5';

type PriceType = 'fixed' | 'from';

type ServiceItem = MasterOnboardingService & {
  priceType?: PriceType;
};

type Props = {
  categoryCode?: string | null;
  categoryLabel?: string;
  serviceTitlePlaceholder: string;
  templateHighlightId: string | null;
  onTemplateSelect: (template: ServiceTemplate) => void;
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  titleError?: string;
  duration: string;
  onDurationChange: (value: string) => void;
  onDurationBlur: () => void;
  durationError?: string;
  price: string;
  onPriceChange: (value: string) => void;
  onPriceBlur: () => void;
  priceError?: string;
  priceType: PriceType;
  onPriceTypeChange: (type: PriceType) => void;
  pricePreviewLabel: string | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  descriptionError?: string;
  formError?: string;
  editingId: string | null;
  onSubmit: () => void;
  onCancelEdit: () => void;
  services: ServiceItem[];
  onStartEditService: (service: ServiceItem) => void;
  onRemoveService: (id: string) => void;
  onToggleServiceActive: (id: string) => void;
  addDisabled?: boolean;
  addDisabledHint?: string;
};

function fieldErrorClass(error?: string) {
  return error ? 'mt-1.5 text-[12px] font-medium leading-snug text-red-600' : 'hidden';
}

export function OnboardingStep5Services({
  categoryCode,
  categoryLabel,
  serviceTitlePlaceholder,
  templateHighlightId,
  onTemplateSelect,
  title,
  onTitleChange,
  onTitleBlur,
  titleError,
  duration,
  onDurationChange,
  onDurationBlur,
  durationError,
  price,
  onPriceChange,
  onPriceBlur,
  priceError,
  priceType,
  onPriceTypeChange,
  pricePreviewLabel,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  descriptionError,
  formError,
  editingId,
  onSubmit,
  onCancelEdit,
  services,
  onStartEditService,
  onRemoveService,
  onToggleServiceActive,
  addDisabled = false,
  addDisabledHint,
}: Props) {
  /** Слева — только услуги, уже добавленные кнопкой «Добавить услугу». */
  const previewServices = useMemo(
    (): DemoMasterService[] =>
      services.filter((s) => s.isActive !== false).map(managedServiceToClientPreview),
    [services],
  );

  const activeCount = useMemo(() => countActiveOnboardingServices(services), [services]);
  const overActiveFreeLimit = exceedsFreeActiveServiceLimit(activeCount);

  const intro = (
    <>
      <p className={onboardingEyebrowClass}>Услуги</p>
      <h1 className={onboardingStepTitleClass}>Добавьте услуги</h1>
      <p className="mt-2 text-[14px] font-medium leading-snug text-[#6B7280] lg:text-[15px]">
        {ONBOARDING_PLAN_COPY.servicesStepLead}
      </p>
      <div className="mt-3 rounded-[16px] bg-[#F8FAFC] px-3.5 py-3 ring-1 ring-[#E5E7EB]">
        <p className="text-[13px] font-semibold text-[#111827]">
          {overActiveFreeLimit
            ? ONBOARDING_PLAN_COPY.servicesActiveOverLimit(activeCount)
            : ONBOARDING_PLAN_COPY.servicesActiveCounter(activeCount)}
        </p>
        <p className="mt-1 text-[12px] font-medium leading-snug text-[#6B7280]">
          {overActiveFreeLimit
            ? ONBOARDING_PLAN_COPY.servicesOverFreeLimit
            : ONBOARDING_PLAN_COPY.servicesWithinFreeLimit}
        </p>
      </div>
    </>
  );

  const preview = (
    <div
      className={`overflow-hidden rounded-[16px] ring-1 ring-[#EAECEF] ${catalogCanvasClass}`}
      aria-label="Превью услуг в каталоге"
    >
      <div className="pointer-events-none p-3 sm:p-4">
        <MasterServicesList
          services={previewServices}
          categoryCode={categoryCode ?? undefined}
          categoryLabel={categoryLabel}
          highlightServiceId={editingId}
          layout="desktop"
          previewMode
          onSelect={() => {}}
        />
      </div>
    </div>
  );

  const form = (
    <div className="space-y-4">
      <AdminFormSheetSection
        title="Добавление"
        description="Заполните услугу вручную или выберите из популярных для вашей категории"
      >
        <PopularServiceTemplatesChips
          collapsible
          variant="cabinet"
          categoryCode={categoryCode}
          categoryLabel={categoryLabel}
          selectedId={templateHighlightId}
          onSelect={onTemplateSelect}
        />

        <div className="mt-4 space-y-4 border-t border-dashed border-[#E5E7EB] pt-4">
        <label className="block">
          <AdminSheetFieldLabel required className={sheetLabelClass}>
            Название услуги
          </AdminSheetFieldLabel>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            className={sheetFieldClass}
            placeholder={serviceTitlePlaceholder}
            maxLength={300}
          />
          <p className={fieldErrorClass(titleError)}>{titleError}</p>
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <AdminSheetFieldLabel required className={sheetLabelClass}>
              Длительность, мин
            </AdminSheetFieldLabel>
            <input
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
              onBlur={onDurationBlur}
              inputMode="numeric"
              className={sheetFieldClass}
              placeholder="60"
            />
            <p className={fieldErrorClass(durationError)}>{durationError}</p>
          </label>

          <label className="block">
            <AdminSheetFieldLabel required className={sheetLabelClass}>
              Цена, BYN
            </AdminSheetFieldLabel>
            <input
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              onBlur={onPriceBlur}
              inputMode="decimal"
              className={sheetFieldClass}
              placeholder="45"
            />
            <p className={fieldErrorClass(priceError)}>{priceError}</p>
          </label>
        </div>
        </div>
      </AdminFormSheetSection>

      <AdminFormSheetSection title="Тип цены" description="Как показывать цену в каталоге">
        <div className={sheetSegmentWrap} role="radiogroup" aria-label="Тип цены">
          <button
            type="button"
            role="radio"
            aria-checked={priceType === 'fixed'}
            onClick={() => onPriceTypeChange('fixed')}
            className={sheetSegmentClass(priceType === 'fixed')}
          >
            Точная цена
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={priceType === 'from'}
            onClick={() => onPriceTypeChange('from')}
            className={sheetSegmentClass(priceType === 'from')}
          >
            Цена от
          </button>
        </div>
        <p className={`mt-2 ${sheetHintClass}`}>
          {pricePreviewLabel ? (
            <>
              Клиент увидит: <span className="font-semibold text-[#111827]">{pricePreviewLabel}</span>
            </>
          ) : (
            'Укажите цену — покажем, как она отобразится в каталоге'
          )}
        </p>
      </AdminFormSheetSection>

      <AdminFormSheetSection title="Описание">
        <label className="block">
          <span className="sr-only">Описание</span>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={onDescriptionBlur}
            rows={3}
            maxLength={1000}
            className={`${sheetFieldClass} resize-none leading-relaxed`}
            placeholder="Что входит в услугу"
          />
          <p className={fieldErrorClass(descriptionError)}>{descriptionError}</p>
        </label>
      </AdminFormSheetSection>

      {overActiveFreeLimit ? (
        <p className="rounded-[12px] bg-[#FFFBEB] px-4 py-3 text-[13px] font-medium leading-snug text-[#92400E] ring-1 ring-[#FDE68A]">
          {ONBOARDING_PLAN_COPY.servicesOverFreeLimit}
        </p>
      ) : null}

      {formError ? (
        <p className="rounded-[10px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
          {formError}
        </p>
      ) : null}

      {services.length > 0 ? (
        <AdminFormSheetSection
          title="Добавленные услуги"
          description={onboardingServicesListDescription(services)}
        >
          <ul className="space-y-2">
            {services.map((service) => {
              const isActive = service.isActive !== false;
              return (
              <li
                key={service.id}
                className={`flex items-start justify-between gap-3 rounded-[14px] bg-white p-3 shadow-[0_1px_8px_rgba(17,24,39,0.05)] ring-1 ring-[#EAECEF] ${
                  editingId === service.id ? 'ring-2 ring-[#F47C8C]/40' : ''
                } ${!isActive ? 'opacity-80' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[#111827]">
                      {service.title}
                    </p>
                    {!isActive ? (
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[#6B7280]">
                        {ONBOARDING_PLAN_COPY.serviceInactiveOnFree}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                    {serviceDurationLabel(service.durationMin)} · {formatOnboardingServicePrice(service)}
                  </p>
                  {service.description ? (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6B7280]">
                      {service.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold">
                    <button
                      type="button"
                      onClick={() => onToggleServiceActive(service.id)}
                      className="text-[#374151] underline-offset-2 hover:underline"
                    >
                      {isActive ? 'Отключить на Free' : 'Включить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartEditService(service)}
                      className="text-[#F47C8C] underline-offset-2 hover:underline"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveService(service.id)}
                      className="text-[#6B7280] underline-offset-2 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
        </AdminFormSheetSection>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onSubmit}
          disabled={addDisabled && !editingId}
          className={`${sheetPrimaryBtnClass} sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {editingId ? 'Сохранить услугу' : 'Добавить услугу'}
        </button>
        {editingId ? (
          <button type="button" onClick={onCancelEdit} className={`${sheetCancelBtnClass} sm:flex-1`}>
            Отмена
          </button>
        ) : null}
      </div>

      {addDisabled && !editingId && addDisabledHint ? (
        <p className="text-[12px] font-medium leading-snug text-[#B66A24]">{addDisabledHint}</p>
      ) : null}

      {services.length > 0 ? (
        <p className="text-center text-[12px] font-medium text-[#6B7280] lg:text-left">
          {services.length}{' '}
          {services.length === 1 ? 'услуга добавлена' : services.length < 5 ? 'услуги добавлены' : 'услуг добавлено'}
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      data-onboarding-field="services"
      className={`mt-0 scroll-mt-28 transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32 ${onboardingFieldScrollClass}`}
    >
      <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-12">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          {intro}
          <div className="mt-5 hidden lg:block">{preview}</div>
        </div>

        <div className="mt-4 min-w-0 lg:mt-0">
          <div className="rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:p-5">
            {form}
          </div>
          <div className="mt-5 lg:hidden">{preview}</div>
        </div>
      </div>
    </div>
  );
}
