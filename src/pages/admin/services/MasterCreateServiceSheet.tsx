import { useCallback, useMemo, useState } from 'react';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { postMasterService } from '../../../features/admin/api/masterCabinetApi';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminSheetFieldLabel } from '../shared/AdminFormFieldLabel';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import {
  sheetFieldClass,
  sheetLabelClass,
  sheetSegmentClass,
} from '../profile/adminProfileCabinetTheme';
import { useSingleFlight } from '../shared/useSingleFlight';
import {
  getServiceTitlePlaceholder,
  templatePriceTypeToApp,
  type ServiceTemplate,
} from '../../../constants/serviceTemplates';
import { PopularServiceTemplatesChips } from '../../../features/catalog/PopularServiceTemplatesChips';
import {
  cabinetServiceDtoToManaged,
  draftWithServices,
} from './servicesCabinetSync';
import type { ManagedService } from './servicesFormat';

const DEFAULT_SERVICE_DURATION_MIN = 60;

function newServiceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `svc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeService(service: MasterOnboardingService, index: number): ManagedService {
  const item = service as ManagedService;
  return {
    ...item,
    priceType: item.priceType ?? 'fixed',
    isActive: item.isActive ?? true,
    sortOrder: item.sortOrder ?? index,
  };
}

const sheetSegmentWrap = 'grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5';

type Props = {
  open: boolean;
  onClose: () => void;
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
  useCabinetApi: boolean;
  onCreated?: (serviceId: string) => void;
};

export function MasterCreateServiceSheet({
  open,
  onClose,
  draft,
  onPersist,
  useCabinetApi,
  onCreated,
}: Props) {
  const { commitDraftBaseline } = useAdminMasterCabinet();
  const { freeServiceLimitReached } = useMasterPlanEntitlements();
  const { busy, run } = useSingleFlight();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'from'>('fixed');
  const [durationMin, setDurationMin] = useState(String(DEFAULT_SERVICE_DURATION_MIN));
  const [desc, setDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [templateHighlightId, setTemplateHighlightId] = useState<string | null>(null);

  const services = useMemo(
    () =>
      draft.services
        .map((service, index) => normalizeService(service, index))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.services],
  );

  const serviceCategoryCode = draft.primaryCategoryCode ?? draft.category;
  const serviceTitlePlaceholder = useMemo(
    () => getServiceTitlePlaceholder(serviceCategoryCode),
    [serviceCategoryCode],
  );

  const resetForm = useCallback(() => {
    setTitle('');
    setPrice('');
    setPriceType('fixed');
    setDurationMin(String(DEFAULT_SERVICE_DURATION_MIN));
    setDesc('');
    setFormError(null);
    setTemplateHighlightId(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const applyServiceTemplate = useCallback((tm: ServiceTemplate) => {
    setTitle(tm.title);
    setPrice(String(tm.price));
    setPriceType(templatePriceTypeToApp(tm.priceType));
    setDesc(tm.description ?? '');
    setDurationMin(String(tm.durationMinutes));
    setTemplateHighlightId(tm.id);
    setFormError(null);
  }, []);

  const saveService = useCallback(async () => {
    if (freeServiceLimitReached) {
      setFormError('На тарифе Free можно не больше 3 услуг.');
      return;
    }

    const preparedTitle = title.trim();
    const preparedDescription = desc.trim();
    const durationNumber = Number.parseInt(durationMin, 10) || DEFAULT_SERVICE_DURATION_MIN;
    const priceNumber = Number.parseFloat(price.replace(',', '.').trim());

    if (!preparedTitle) {
      setFormError('Укажите название услуги.');
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setFormError('Укажите цену. Можно 0.');
      return;
    }

    await run(async () => {
      const nextService: ManagedService = {
        id: newServiceId(),
        title: preparedTitle,
        durationMin: durationNumber,
        priceByn: priceNumber,
        priceType,
        isActive: true,
        description: preparedDescription,
        sortOrder: services.length,
      };
      const nextServices = [...services, nextService];

      if (!useCabinetApi) {
        onPersist(draftWithServices(draft, nextServices));
        handleClose();
        onCreated?.(nextService.id);
        return;
      }

      const catId = draft.primaryCategoryId;
      if (!catId) {
        setFormError('Сначала укажите категорию в профиле (основная информация).');
        return;
      }

      setFormError(null);
      try {
        const row = await postMasterService({
          categoryId: catId,
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType,
          sortOrder: nextService.sortOrder ?? 0,
        });
        const synced = [...services, cabinetServiceDtoToManaged(row, services.length)];
        commitDraftBaseline(draftWithServices(draft, synced));
        handleClose();
        onCreated?.(row.id);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    });
  }, [
    commitDraftBaseline,
    desc,
    draft,
    durationMin,
    freeServiceLimitReached,
    handleClose,
    onCreated,
    onPersist,
    price,
    priceType,
    run,
    services,
    title,
    useCabinetApi,
  ]);

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={handleClose}
      title="Новая услуга"
      footer={
        <div className="flex w-full gap-3">
          <button type="button" onClick={handleClose} disabled={busy} className={catalogSheetSecondaryBtn}>
            Отмена
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveService()}
            className={catalogSheetPrimaryBtn}
          >
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {formError ? (
          <p className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#B91C1C]">
            {formError}
          </p>
        ) : null}

        <AdminFormSheetSection title="Основное" description="Название и цена для каталога">
          <PopularServiceTemplatesChips
            collapsible
            collapsibleCompact
            variant="cabinet"
            categoryCode={serviceCategoryCode}
            categoryLabel={draft.category}
            selectedId={templateHighlightId}
            onSelect={applyServiceTemplate}
            className="mb-4"
          />
          <label className="block">
            <AdminSheetFieldLabel required className={sheetLabelClass}>
              Название услуги
            </AdminSheetFieldLabel>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setTemplateHighlightId(null);
              }}
              className={sheetFieldClass}
              placeholder={serviceTitlePlaceholder}
            />
          </label>
          <label className="mt-4 block">
            <AdminSheetFieldLabel required className={sheetLabelClass}>
              Цена, BYN
            </AdminSheetFieldLabel>
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              className={sheetFieldClass}
              placeholder="45"
            />
          </label>
        </AdminFormSheetSection>

        <AdminFormSheetSection title="Тип цены">
          <div className={sheetSegmentWrap}>
            {(
              [
                { id: 'fixed' as const, label: 'Точная цена' },
                { id: 'from' as const, label: 'Цена от' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPriceType(item.id)}
                className={sheetSegmentClass(priceType === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </AdminFormSheetSection>
      </div>
    </AdminBottomSheet>
  );
}
