import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminSectionTab } from '../useAdminSectionTab';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { useSingleFlight } from '../shared/useSingleFlight';
import { useNavigate } from 'react-router-dom';
import type {
  MasterDraft,
  MasterOnboardingService,
} from '../../../features/profile/lib/demoMasterStorage';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { ADMIN_BILLING_PATH, ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import {
  deleteMasterService,
  patchMasterService,
  postMasterService,
} from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { isProRequiredApiMessage } from '../../../features/billing/masterProUpsell';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import {
  SERVICE_DELETE_BLOCKED_MESSAGE,
  serviceHasUpcomingAppointments,
} from './serviceDeleteGuard';
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
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { managedServiceToClientPreview } from '../../../features/admin/lib/managedServiceToClientPreview';
import { MasterServiceClientPreview } from '../../../features/profile/components/MasterServiceClientPreview';
import {
  SERVICES_MOBILE_CANVAS,
  servicesDesktopCard,
  servicesDesktopTabsSticky,
  servicesShellCard,
} from './adminServicesTheme';
import { ServicesSectionTabs } from './ServicesSectionTabs';
import { computeServicesTabMetrics } from './servicesTabMetrics';
import { ServicesBundleFormSheet } from './ServicesBundleFormSheet';
import { ServicesBundleMenuSheet } from './ServicesBundleMenuSheet';
import { ServicesBundlesTab } from './ServicesBundlesTab';
import { getMySlots, type MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import { subscribeMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import { useServiceBookingStats } from './useServiceBookingStats';
import { ServicesCatalogTab } from './ServicesCatalogTab';
import { ServicesPageHeader } from './ServicesPageHeader';
import { SERVICES_TAB_INTRO_IMAGES } from './ServicesTabIntro';
import { ServicesPriceTab } from './ServicesPriceTab';
import { ServicesPromotionFormSheet } from './ServicesPromotionFormSheet';
import { ServicesPromotionsTab } from './ServicesPromotionsTab';
import { ServicesServiceMenuSheet } from './ServicesServiceMenuSheet';
import { ServicesTabBar } from './ServicesTabBar';
import {
  deleteMasterBundle,
  deleteMasterPromotion,
  fetchMasterBundles,
  fetchMasterPromotions,
  patchMasterBundle,
  patchMasterPromotion,
  postMasterBundle,
  postMasterPromotion,
} from '../../../features/admin/api/masterServiceExtrasApi';
import {
  getServiceTitlePlaceholder,
  templatePriceTypeToApp,
  type ServiceTemplate,
} from '../../../constants/serviceTemplates';
import { PopularServiceTemplatesChips } from '../../../features/catalog/PopularServiceTemplatesChips';
import { loadServiceBundles, loadServicePromotions, saveServiceBundles, saveServicePromotions } from './servicesStorage';
import {
  cabinetServiceDtoToManaged,
  draftWithServices,
  reindexManagedServices,
} from './servicesCabinetSync';
import type { ServiceBundle, ServicePromotion, ServicesTabId } from './servicesTypes';

const SERVICES_TABS = ['catalog', 'price', 'bundles', 'promotions'] as const satisfies readonly ServicesTabId[];

type PriceType = 'fixed' | 'from';

type ServiceSheetMode = 'create' | 'full' | 'price';

/** API требует длительность; в форме не показываем — подставляем по умолчанию или из шаблона. */
const DEFAULT_SERVICE_DURATION_MIN = 60;

type ManagedService = MasterOnboardingService & {
  priceType?: PriceType;
  isActive?: boolean;
  sortOrder?: number;
};

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

function newServiceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `svc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldClass(): string {
  return sheetFieldClass;
}

const sheetSegmentWrap = 'grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5';

function normalizeService(service: MasterOnboardingService, index: number): ManagedService {
  const item = service as ManagedService;

  return {
    ...item,
    priceType: item.priceType ?? 'fixed',
    isActive: item.isActive ?? true,
    sortOrder: item.sortOrder ?? index,
  };
}

export function AdminServicesTab({ draft, onPersist }: Props) {
  const navigate = useNavigate();
  const { useCabinetApi, commitDraftBaseline, appointments } = useAdminMasterCabinet();
  const { canUseBundlesAndPromotions, freeServiceLimitReached } = useMasterPlanEntitlements();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<ServiceSheetMode>('full');
  const [freeLimitOpen, setFreeLimitOpen] = useState(false);
  const [extrasProOpen, setExtrasProOpen] = useState(false);
  const extrasLocked = !canUseBundlesAndPromotions;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedService | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ManagedService | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [slotsPromptServiceId, setSlotsPromptServiceId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useAdminSectionTab('tab', 'catalog', SERVICES_TABS);
  const [menuTarget, setMenuTarget] = useState<ManagedService | null>(null);
  const [bundles, setBundles] = useState<ServiceBundle[]>(() => loadServiceBundles());
  const [promotions, setPromotions] = useState<ServicePromotion[]>(() => loadServicePromotions());
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [promoFormOpen, setPromoFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<ServicePromotion | null>(null);
  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null);
  const [bundleMenuTarget, setBundleMenuTarget] = useState<ServiceBundle | null>(null);
  const [catalogSlots, setCatalogSlots] = useState<MySlotDto[] | null>(null);
  const [catalogSlotsError, setCatalogSlotsError] = useState<string | null>(null);

  const reloadCatalogSlots = useCallback(() => {
    if (!useCabinetApi) {
      setCatalogSlots(null);
      setCatalogSlotsError(null);
      return;
    }
    setCatalogSlotsError(null);
    void getMySlots()
      .then((rows) => {
        setCatalogSlots(rows);
        setCatalogSlotsError(null);
      })
      .catch(() => {
        setCatalogSlots(null);
        setCatalogSlotsError('Не удалось проверить окна для записи. Обновите страницу или попробуйте позже.');
      });
  }, [useCabinetApi]);

  useEffect(() => {
    reloadCatalogSlots();
  }, [reloadCatalogSlots, draft.services.length]);

  useEffect(() => subscribeMasterSlotsChanged(reloadCatalogSlots), [reloadCatalogSlots]);

  useEffect(() => {
    preloadTabIntroImages(SERVICES_TAB_INTRO_IMAGES);
  }, []);

  const reloadServiceExtras = useCallback(async () => {
    if (!useCabinetApi) {
      setBundles(loadServiceBundles());
      setPromotions(loadServicePromotions());
      return;
    }
    setExtrasLoading(true);
    setExtrasError(null);
    try {
      const [nextBundles, nextPromotions] = await Promise.all([
        fetchMasterBundles(),
        fetchMasterPromotions(),
      ]);
      setBundles(nextBundles);
      setPromotions(nextPromotions);
    } catch (e) {
      setExtrasError(e instanceof Error ? e.message : 'Не удалось загрузить наборы и акции');
    } finally {
      setExtrasLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setBundles(loadServiceBundles());
      setPromotions(loadServicePromotions());
      return;
    }
    if (extrasLocked) return;
    void reloadServiceExtras();
  }, [extrasLocked, reloadServiceExtras, useCabinetApi]);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [isActive, setIsActive] = useState(true);
  const [desc, setDesc] = useState('');
  const [durationMin, setDurationMin] = useState(String(DEFAULT_SERVICE_DURATION_MIN));
  const [formError, setFormError] = useState<string | null>(null);
  const [templateHighlightId, setTemplateHighlightId] = useState<string | null>(null);
  const { busy: serviceActionBusy, run: runServiceAction } = useSingleFlight();

  const services = useMemo(
    () =>
      draft.services
        .map((service, index) => normalizeService(service, index))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.services],
  );

  const serviceStats = useServiceBookingStats(services, catalogSlotsError ? null : catalogSlots, appointments);
  const hasAnyBookableSlots = useMemo(() => {
    if (catalogSlotsError || catalogSlots === null) return false;
    return catalogSlots.some(
      (slot) => slot.status === 'available' && new Date(slot.startsAt).getTime() > Date.now(),
    );
  }, [catalogSlots, catalogSlotsError]);

  const serviceCategoryCode = draft.primaryCategoryCode ?? draft.category;

  const serviceTitlePlaceholder = useMemo(
    () => getServiceTitlePlaceholder(serviceCategoryCode),
    [serviceCategoryCode],
  );

  const applyServiceTemplate = useCallback((tm: ServiceTemplate) => {
    setTitle(tm.title);
    setPrice(String(tm.price));
    setPriceType(templatePriceTypeToApp(tm.priceType));
    setDesc(tm.description ?? '');
    setDurationMin(String(tm.durationMinutes));
    setTemplateHighlightId(tm.id);
    setFormError(null);
  }, []);

  const persistServices = useCallback(
    (nextServices: ManagedService[], message?: string) => {
      onPersist(draftWithServices(draft, nextServices));

      if (message) {
        setToast(message);
        window.setTimeout(() => setToast(null), 1800);
      }
    },
    [draft, onPersist],
  );

  const commitServices = useCallback(
    (nextServices: ManagedService[]) => {
      if (useCabinetApi) {
        commitDraftBaseline(draftWithServices(draft, nextServices));
        return;
      }
      persistServices(nextServices);
    },
    [commitDraftBaseline, draft, persistServices, useCabinetApi],
  );

  const showSuccessToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const openServiceScheduleWizard = useCallback(
    (serviceId: string) => {
      navigate(
        `${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month&serviceId=${encodeURIComponent(serviceId)}`,
      );
    },
    [navigate],
  );

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setPrice('');
    setPriceType('fixed');
    setIsActive(true);
    setDesc('');
    setDurationMin(String(DEFAULT_SERVICE_DURATION_MIN));
    setFormError(null);
    setTemplateHighlightId(null);
  }, []);

  const loadServiceIntoForm = useCallback((service: ManagedService) => {
    setEditingId(service.id);
    setTitle(service.title);
    setPrice(String(service.priceByn));
    setPriceType(service.priceType ?? 'fixed');
    setIsActive(service.isActive ?? true);
    setDesc(service.description ?? '');
    setDurationMin(String(service.durationMin ?? DEFAULT_SERVICE_DURATION_MIN));
    setFormError(null);
    setTemplateHighlightId(null);
  }, []);

  const openCreate = useCallback(() => {
    if (freeServiceLimitReached) {
      setFreeLimitOpen(true);
      return;
    }
    setListError(null);
    resetForm();
    setSheetMode('create');
    setSheetOpen(true);
  }, [resetForm, services.length]);

  const openEdit = useCallback(
    (service: ManagedService, mode: ServiceSheetMode = 'full') => {
      setListError(null);
      loadServiceIntoForm(service);
      setSheetMode(mode);
      setSheetOpen(true);
    },
    [loadServiceIntoForm],
  );

  const openEditPrice = useCallback(
    (service: ManagedService) => openEdit(service, 'price'),
    [openEdit],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    resetForm();
  }, [resetForm]);

  const saveService = useCallback(async () => {
    const existing = editingId ? services.find((service) => service.id === editingId) : undefined;
    const quickPrice = sheetMode === 'price' && Boolean(existing);

    let preparedTitle = title.trim();
    let preparedDescription = desc.trim();
    const durationNumber = quickPrice && existing
      ? (existing.durationMin ?? DEFAULT_SERVICE_DURATION_MIN)
      : Number.parseInt(durationMin, 10) || DEFAULT_SERVICE_DURATION_MIN;
    let priceNumber = Number.parseFloat(price.replace(',', '.').trim());
    let activeFlag = isActive;
    let priceTypeValue = priceType;

    if (quickPrice && existing) {
      preparedTitle = existing.title;
      preparedDescription = existing.description ?? '';
      activeFlag = existing.isActive ?? true;
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        setFormError('Укажите цену. Можно 0.');
        return;
      }
    } else {
      if (!preparedTitle) {
        setFormError('Укажите название услуги.');
        return;
      }

      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        setFormError('Укажите цену. Можно 0.');
        return;
      }
    }

    if (!editingId && freeServiceLimitReached) {
      setFormError('На тарифе Free можно не больше 3 услуг.');
      setFreeLimitOpen(true);
      return;
    }

    await runServiceAction(async () => {
    const nextService: ManagedService = {
      id: editingId ?? newServiceId(),
      title: preparedTitle,
      durationMin: durationNumber,
      priceByn: priceNumber,
      priceType: priceTypeValue,
      isActive: activeFlag,
      description: preparedDescription,
      sortOrder: editingId
        ? services.find((service) => service.id === editingId)?.sortOrder ?? services.length
        : services.length,
    };

    const nextServices = editingId
      ? services.map((service) => (service.id === editingId ? nextService : service))
      : [...services, nextService];

    if (!useCabinetApi) {
      const okMsg = quickPrice
        ? 'Цена обновлена'
        : editingId
          ? 'Услуга обновлена'
          : 'Услуга создана';
      persistServices(nextServices, okMsg);
      if (!editingId && !quickPrice) {
        setSlotsPromptServiceId(nextService.id);
      }
      closeSheet();
      return;
    }

    const catId = draft.primaryCategoryId;
    if (!catId) {
      setFormError('Сначала укажите категорию в профиле (основная информация).');
      return;
    }

    const okMsg = quickPrice
      ? 'Цена обновлена'
      : editingId
        ? 'Услуга обновлена'
        : 'Услуга создана';

    setFormError(null);
    try {
      let syncedServices = nextServices;

      if (editingId && isUuid(editingId)) {
        const row = await patchMasterService(editingId, {
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType: priceTypeValue,
          isActive: activeFlag,
          sortOrder: nextService.sortOrder ?? 0,
        });
        const mapped = cabinetServiceDtoToManaged(row, nextService.sortOrder ?? 0);
        syncedServices = services.map((service) => (service.id === editingId ? mapped : service));
      } else if (!editingId) {
        const row = await postMasterService({
          categoryId: catId,
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType: priceTypeValue,
          sortOrder: nextService.sortOrder ?? 0,
        });
        syncedServices = [...services, cabinetServiceDtoToManaged(row, services.length)];
      } else {
        persistServices(nextServices, okMsg);
        closeSheet();
        return;
      }

      commitServices(syncedServices);
      showSuccessToast(okMsg);
      if (!editingId && !quickPrice) {
        const created = syncedServices[syncedServices.length - 1];
        if (created) setSlotsPromptServiceId(created.id);
      }
      closeSheet();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
    });
  }, [
    closeSheet,
    desc,
    draft.primaryCategoryId,
    editingId,
    isActive,
    commitServices,
    persistServices,
    price,
    priceType,
    runServiceAction,
    services,
    sheetMode,
    showSuccessToast,
    title,
    useCabinetApi,
  ]);

  const toggleActive = useCallback(
    async (service: ManagedService) => {
      const nextServices = services.map((item) =>
        item.id === service.id
          ? {
              ...item,
              isActive: !item.isActive,
            }
          : item,
      );

      if (!useCabinetApi) {
        persistServices(nextServices, service.isActive ? 'Услуга скрыта' : 'Услуга снова видна');
        return;
      }

      if (!isUuid(service.id)) {
        persistServices(nextServices, service.isActive ? 'Услуга скрыта' : 'Услуга снова видна');
        return;
      }

      const previous = services;
      commitServices(nextServices);
      setListError(null);
      try {
        const row = await patchMasterService(service.id, { isActive: !service.isActive });
        commitServices(
          previous.map((item) =>
            item.id === service.id ? cabinetServiceDtoToManaged(row, item.sortOrder ?? 0) : item,
          ),
        );
        showSuccessToast(service.isActive ? 'Услуга скрыта' : 'Услуга снова видна');
      } catch (e) {
        commitServices(previous);
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [commitServices, persistServices, services, showSuccessToast, useCabinetApi],
  );

  const duplicateService = useCallback(
    async (service: ManagedService) => {
      if (freeServiceLimitReached) {
        setFreeLimitOpen(true);
        return;
      }
      const copy: ManagedService = {
        ...service,
        id: newServiceId(),
        title: `${service.title.trim()} · 2`,
        isActive: false,
        sortOrder: services.length,
      };

      if (!useCabinetApi) {
        persistServices([...services, copy], 'Услуга продублирована');
        return;
      }

      const catId = draft.primaryCategoryId;
      if (!catId) {
        setFormError('Сначала укажите категорию в профиле.');
        return;
      }

      setListError(null);
      try {
        const created = await postMasterService({
          categoryId: catId,
          title: copy.title,
          description: copy.description ?? '',
          durationMinutes: copy.durationMin,
          priceAmount: copy.priceByn,
          priceType: copy.priceType === 'from' ? 'from' : 'fixed',
          sortOrder: copy.sortOrder ?? 0,
        });
        const hidden = await patchMasterService(created.id, { isActive: false });
        commitServices([
          ...services,
          { ...cabinetServiceDtoToManaged(hidden, services.length), isActive: false },
        ]);
        showSuccessToast('Услуга продублирована');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [commitServices, draft.primaryCategoryId, persistServices, services, showSuccessToast, useCabinetApi],
  );

  const moveService = useCallback(
    async (serviceId: string, direction: -1 | 1) => {
      const index = services.findIndex((service) => service.id === serviceId);
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= services.length) return;

      const nextServices = [...services];
      const current = nextServices[index];
      const target = nextServices[targetIndex];

      if (!current || !target) return;

      nextServices[index] = target;
      nextServices[targetIndex] = current;

      const reindexed = reindexManagedServices(nextServices);

      if (!useCabinetApi) {
        persistServices(reindexed, 'Порядок обновлен');
        return;
      }

      const previous = services;
      commitServices(reindexed);
      setListError(null);
      try {
        const prevById = new Map(services.map((s) => [s.id, s]));
        const patches: Promise<ManagedService>[] = [];
        for (const s of reindexed) {
          if (!isUuid(s.id)) continue;
          const old = prevById.get(s.id);
          if (!old || (old.sortOrder ?? 0) === (s.sortOrder ?? 0)) continue;
          patches.push(
            patchMasterService(s.id, { sortOrder: s.sortOrder ?? 0 }).then((row) =>
              cabinetServiceDtoToManaged(row, s.sortOrder ?? 0),
            ),
          );
        }
        if (patches.length > 0) {
          const updatedRows = await Promise.all(patches);
          const byId = new Map(updatedRows.map((row) => [row.id, row]));
          commitServices(reindexed.map((s) => byId.get(s.id) ?? s));
        }
        showSuccessToast('Порядок обновлен');
      } catch (e) {
        commitServices(previous);
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [commitServices, persistServices, services, showSuccessToast, useCabinetApi],
  );

  const isServiceDeleteBlocked = useCallback(
    (service: ManagedService) => serviceHasUpcomingAppointments(appointments, service),
    [appointments],
  );

  const requestDeleteService = useCallback(
    (service: ManagedService) => {
      if (isServiceDeleteBlocked(service)) {
        setDeleteError(SERVICE_DELETE_BLOCKED_MESSAGE);
        setDeleteTarget(service);
        return;
      }
      setDeleteError(null);
      setDeleteTarget(service);
    },
    [isServiceDeleteBlocked],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    if (isServiceDeleteBlocked(deleteTarget)) {
      setDeleteError(SERVICE_DELETE_BLOCKED_MESSAGE);
      return;
    }

    await runServiceAction(async () => {
    if (!useCabinetApi) {
      persistServices(
        services.filter((service) => service.id !== deleteTarget.id),
        'Услуга удалена',
      );
      setDeleteTarget(null);
      setDeleteError(null);
      return;
    }

    setDeleteError(null);
    try {
      if (isUuid(deleteTarget.id)) {
        await deleteMasterService(deleteTarget.id);
        commitServices(services.filter((service) => service.id !== deleteTarget.id));
        setDeleteTarget(null);
        setDeleteError(null);
        showSuccessToast('Услуга удалена');
      } else {
        persistServices(services.filter((service) => service.id !== deleteTarget.id), 'Услуга удалена');
        setDeleteTarget(null);
        setDeleteError(null);
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Не удалось удалить');
    }
    });
  }, [
    commitServices,
    deleteTarget,
    isServiceDeleteBlocked,
    persistServices,
    runServiceAction,
    services,
    showSuccessToast,
    useCabinetApi,
  ]);

  const persistPromotionsLocal = useCallback((rows: ServicePromotion[]) => {
    setPromotions(rows);
    saveServicePromotions(rows);
  }, []);

  const persistBundlesLocal = useCallback((rows: ServiceBundle[]) => {
    setBundles(rows);
    saveServiceBundles(rows);
  }, []);

  const upsertBundle = useCallback((saved: ServiceBundle, existed: boolean) => {
    setBundles((prev) => {
      const next = existed
        ? prev.map((row) => (row.id === saved.id ? saved : row))
        : [saved, ...prev];
      if (!useCabinetApi) saveServiceBundles(next);
      return next;
    });
  }, [useCabinetApi]);

  const removeBundle = useCallback(
    (id: string) => {
      setBundles((prev) => {
        const next = prev.filter((row) => row.id !== id);
        if (!useCabinetApi) saveServiceBundles(next);
        return next;
      });
    },
    [useCabinetApi],
  );

  const upsertPromotion = useCallback((saved: ServicePromotion, existed: boolean) => {
    setPromotions((prev) => {
      const next = existed
        ? prev.map((row) => (row.id === saved.id ? saved : row))
        : [saved, ...prev];
      if (!useCabinetApi) saveServicePromotions(next);
      return next;
    });
  }, [useCabinetApi]);

  const removePromotion = useCallback(
    (id: string) => {
      setPromotions((prev) => {
        const next = prev.filter((row) => row.id !== id);
        if (!useCabinetApi) saveServicePromotions(next);
        return next;
      });
    },
    [useCabinetApi],
  );

  const bundleApiBody = (bundle: ServiceBundle) => ({
    title: bundle.title,
    description: bundle.description,
    serviceIds: bundle.serviceIds.filter((id) => isUuid(id)),
    originalPrice: bundle.originalPrice,
    bundlePrice: bundle.bundlePrice,
    discountPercent: bundle.discountPercent,
    discountAmount: bundle.discountAmount,
    durationMinutes: bundle.durationMinutes,
    imageUrl: bundle.imageUrl,
    imageSource: bundle.imageSource,
    status: bundle.status,
  });

  const promoApiBody = (promo: ServicePromotion, publish: boolean) => ({
    template: promo.template,
    title: promo.title,
    description: promo.description,
    serviceId: promo.serviceId,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountLabel: promo.discountLabel,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    backgroundImage: promo.backgroundImage,
    publish,
  });

  const saveBundle = useCallback(
    async (bundle: ServiceBundle) => {
      if (extrasLocked) {
        setExtrasProOpen(true);
        return;
      }
      const exists = bundles.some((b) => b.id === bundle.id);
      const toastMsg =
        bundle.status === 'draft'
          ? 'Черновик набора сохранён'
          : exists
            ? 'Набор обновлён'
            : 'Набор опубликован';

      if (!useCabinetApi) {
        const next = exists
          ? bundles.map((b) => (b.id === bundle.id ? bundle : b))
          : [bundle, ...bundles];
        persistBundlesLocal(next);
        showSuccessToast(toastMsg);
        return;
      }

      setListError(null);
      try {
        const body = bundleApiBody(bundle);
        const saved =
          exists && isUuid(bundle.id)
            ? await patchMasterBundle(bundle.id, body)
            : await postMasterBundle(body);
        upsertBundle(saved, exists && isUuid(bundle.id));
        showSuccessToast(toastMsg);
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить набор');
        throw e;
      }
    },
    [bundles, extrasLocked, persistBundlesLocal, showSuccessToast, upsertBundle, useCabinetApi],
  );

  const deleteBundle = useCallback(
    async (id: string) => {
      if (extrasLocked) {
        setExtrasProOpen(true);
        return;
      }
      if (!useCabinetApi) {
        persistBundlesLocal(bundles.filter((b) => b.id !== id));
        showSuccessToast('Набор удалён');
        return;
      }
      if (isUuid(id)) {
        await deleteMasterBundle(id);
      }
      removeBundle(id);
      showSuccessToast('Набор удалён');
    },
    [extrasLocked, persistBundlesLocal, removeBundle, showSuccessToast, useCabinetApi],
  );

  const openPromoCreate = useCallback(() => {
    if (extrasLocked) {
      setExtrasProOpen(true);
      return;
    }
    setEditingPromo(null);
    setPromoFormOpen(true);
  }, [extrasLocked]);

  const openPromoEdit = useCallback((promo: ServicePromotion) => {
    if (extrasLocked) {
      setExtrasProOpen(true);
      return;
    }
    setEditingPromo(promo);
    setPromoFormOpen(true);
  }, [extrasLocked]);

  const openBundleCreate = useCallback(() => {
    if (extrasLocked) {
      setExtrasProOpen(true);
      return;
    }
    setEditingBundle(null);
    setBundleFormOpen(true);
  }, [extrasLocked]);

  const openBundleEdit = useCallback((bundle: ServiceBundle) => {
    if (extrasLocked) {
      setExtrasProOpen(true);
      return;
    }
    setEditingBundle(bundle);
    setBundleFormOpen(true);
  }, [extrasLocked]);

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  const savePromo = useCallback(
    async (promo: ServicePromotion, publish: boolean) => {
      if (extrasLocked) {
        setExtrasProOpen(true);
        return;
      }
      if (!useCabinetApi) {
        const rows = editingPromo
          ? promotions.map((p) => (p.id === promo.id ? promo : p))
          : [promo, ...promotions];
        persistPromotionsLocal(rows);
        setPromoFormOpen(false);
        setEditingPromo(null);
        showSuccessToast(publish ? 'Акция опубликована' : 'Черновик сохранён');
        return;
      }

      if (!isUuid(promo.serviceId)) {
        setListError('Выберите услугу из каталога (сохранённую на сервере).');
        return;
      }

      setListError(null);
      try {
        const body = promoApiBody(promo, publish);
        const exists = Boolean(editingPromo && isUuid(editingPromo.id));
        const saved = exists
          ? await patchMasterPromotion(editingPromo!.id, body)
          : await postMasterPromotion(body);
        upsertPromotion(saved, exists);
        setPromoFormOpen(false);
        setEditingPromo(null);
        showSuccessToast(publish ? 'Акция опубликована' : 'Черновик сохранён');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить акцию');
      }
    },
    [editingPromo, extrasLocked, persistPromotionsLocal, showSuccessToast, upsertPromotion, useCabinetApi],
  );

  const deletePromo = useCallback(
    async (id: string) => {
      if (extrasLocked) {
        setExtrasProOpen(true);
        return;
      }
      if (!useCabinetApi) {
        persistPromotionsLocal(promotions.filter((p) => p.id !== id));
        showSuccessToast('Акция удалена');
        return;
      }
      if (isUuid(id)) {
        await deleteMasterPromotion(id);
      }
      removePromotion(id);
      showSuccessToast('Акция удалена');
    },
    [extrasLocked, persistPromotionsLocal, removePromotion, showSuccessToast, useCabinetApi],
  );

  const menuIndex = menuTarget ? services.findIndex((s) => s.id === menuTarget.id) : -1;

  const tabMetrics = useMemo(
    () => computeServicesTabMetrics(services, bundles, promotions),
    [bundles, promotions, services],
  );

  const blockingAlert =
    listError ?? (extrasError && !isProRequiredApiMessage(extrasError) ? extrasError : null);

  const statusAlerts = (
    <>
      {blockingAlert ? (
        <p className="rounded-[16px] border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#B91C1C] lg:rounded-[20px]">
          {blockingAlert}
        </p>
      ) : null}

      {catalogSlotsError ? (
        <p className="rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[14px] font-semibold text-[#92400E] lg:rounded-[20px]">
          {catalogSlotsError}
        </p>
      ) : null}

      {toast ? (
        <div className="rounded-full bg-[#ECFDF5] px-5 py-3 text-center text-[14px] font-semibold text-[#16A34A] shadow-sm">
          {toast}
        </div>
      ) : null}

      {slotsPromptServiceId ? (
        <div className="rounded-[16px] border border-[#D1FAE5] bg-[#ECFDF5] px-4 py-4 lg:rounded-[20px]">
          <p className="text-[14px] font-semibold leading-relaxed text-[#065F46]">
            Услуга создана. Теперь добавьте окна, чтобы клиенты могли записаться.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                openServiceScheduleWizard(slotsPromptServiceId);
                setSlotsPromptServiceId(null);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-4 text-[13px] font-bold text-white transition hover:opacity-95"
            >
              Добавить окна
            </button>
            <button
              type="button"
              onClick={() => setSlotsPromptServiceId(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-white px-4 text-[13px] font-semibold text-[#374151]"
            >
              Позже
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  const tabPanels = (
    <>
      {activeTab === 'catalog' ? (
        <ServicesCatalogTab
            draft={draft}
            services={services}
            onAdd={openCreate}
            onOpenMenu={setMenuTarget}
            serviceStats={serviceStats}
            categoryLabel={draft.category}
            masterId={draft.masterId}
            hasAnySlots={hasAnyBookableSlots}
          />
      ) : null}
      {activeTab === 'price' ? (
        <ServicesPriceTab
            draft={draft}
            services={services}
            onEditPrice={openEditPrice}
          />
      ) : null}
      {activeTab === 'bundles' ? (
        <ServicesBundlesTab
          draft={draft}
          services={services}
          bundles={bundles}
          loading={useCabinetApi && extrasLoading}
          extrasLocked={extrasLocked}
          onConnectPro={() => setExtrasProOpen(true)}
          onCreate={openBundleCreate}
          onMenu={setBundleMenuTarget}
        />
      ) : null}
      {activeTab === 'promotions' ? (
        extrasLoading && useCabinetApi ? (
          <div className="flex min-h-[14rem] items-center justify-center py-8">
            <LoadingVideo size="lg" />
          </div>
        ) : (
          <ServicesPromotionsTab
            draft={draft}
            services={services}
            promotions={promotions}
            extrasLocked={extrasLocked}
            onConnectPro={() => setExtrasProOpen(true)}
            onCreate={openPromoCreate}
            onEdit={openPromoEdit}
            onDelete={(id) => void deletePromo(id)}
          />
        )
      ) : null}
    </>
  );

  return (
    <>
      <ServicesTabBar active={activeTab} onChange={setActiveTab} variant="mobile" />

      <section
        className={`-mx-4 min-w-0 space-y-4 px-4 pb-[calc(5.75rem+1.25rem)] lg:hidden ${SERVICES_MOBILE_CANVAS}`}
      >
        {activeTab !== 'catalog' ? (
          <ServicesPageHeader activeTab={activeTab} metrics={tabMetrics} extrasLocked={extrasLocked} />
        ) : null}
        {statusAlerts}
        <AdminTabContentTransition activeKey={activeTab}>{tabPanels}</AdminTabContentTransition>
      </section>

      <div className={`${servicesShellCard} space-y-6`}>
        <div className={`${servicesDesktopCard} ${servicesDesktopTabsSticky}`}>
          <ServicesSectionTabs active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="min-w-0 space-y-6">
          {activeTab !== 'catalog' ? (
            <ServicesPageHeader activeTab={activeTab} metrics={tabMetrics} extrasLocked={extrasLocked} />
          ) : null}
          {statusAlerts}
          <AdminTabContentTransition activeKey={activeTab} className="min-w-0 space-y-6">
            {tabPanels}
          </AdminTabContentTransition>
        </div>
      </div>

      <ServicesServiceMenuSheet
        open={Boolean(menuTarget)}
        service={menuTarget}
        deleteBlocked={menuTarget ? isServiceDeleteBlocked(menuTarget) : false}
        canMoveUp={menuIndex > 0}
        canMoveDown={menuIndex >= 0 && menuIndex < services.length - 1}
        onClose={() => setMenuTarget(null)}
        onEdit={() => {
          if (menuTarget) openEdit(menuTarget);
          setMenuTarget(null);
        }}
        onToggleActive={() => {
          if (menuTarget) void toggleActive(menuTarget);
          setMenuTarget(null);
        }}
        onDuplicate={() => {
          if (menuTarget) void duplicateService(menuTarget);
          setMenuTarget(null);
        }}
        onPreview={() => {
          if (menuTarget) setPreviewTarget(menuTarget);
          setMenuTarget(null);
        }}
        onAddWindow={() => {
          if (menuTarget) openServiceScheduleWizard(menuTarget.id);
          setMenuTarget(null);
        }}
        onMoveUp={() => {
          if (menuTarget) void moveService(menuTarget.id, -1);
          setMenuTarget(null);
        }}
        onMoveDown={() => {
          if (menuTarget) void moveService(menuTarget.id, 1);
          setMenuTarget(null);
        }}
        onDelete={() => {
          if (menuTarget) requestDeleteService(menuTarget);
          setMenuTarget(null);
        }}
      />

      <ServicesPromotionFormSheet
        open={promoFormOpen}
        services={services}
        initial={editingPromo}
        onClose={() => {
          setPromoFormOpen(false);
          setEditingPromo(null);
        }}
        onSave={savePromo}
      />

      <ServicesBundleFormSheet
        open={bundleFormOpen}
        draft={draft}
        services={services}
        initial={editingBundle}
        onClose={() => {
          setBundleFormOpen(false);
          setEditingBundle(null);
        }}
        onSave={async (bundle) => {
          await saveBundle(bundle);
          setBundleFormOpen(false);
          setEditingBundle(null);
        }}
      />

      <ServicesBundleMenuSheet
        open={Boolean(bundleMenuTarget)}
        bundle={bundleMenuTarget}
        serviceLabels={
          bundleMenuTarget
            ? bundleMenuTarget.serviceIds.map((id) => serviceTitleById.get(id) ?? 'Услуга')
            : []
        }
        onClose={() => setBundleMenuTarget(null)}
        onEdit={() => {
          if (bundleMenuTarget) openBundleEdit(bundleMenuTarget);
          setBundleMenuTarget(null);
        }}
        onDelete={() => {
          if (bundleMenuTarget) void deleteBundle(bundleMenuTarget.id);
          setBundleMenuTarget(null);
        }}
      />

      <AdminBottomSheet
        variant="catalog"
        open={sheetOpen}
        onClose={closeSheet}
        title={
          sheetMode === 'create'
            ? 'Новая услуга'
            : sheetMode === 'price'
              ? 'Изменить цену'
              : editingId
                  ? 'Редактировать услугу'
                  : 'Новая услуга'
        }
        subtitle={
          sheetMode === 'create' || sheetMode === 'price'
            ? undefined
            : 'Изменения сразу отобразятся в каталоге'
        }
        footer={
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={closeSheet}
              disabled={serviceActionBusy}
              className={catalogSheetSecondaryBtn}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={serviceActionBusy}
              onClick={() => void saveService()}
              className={catalogSheetPrimaryBtn}
            >
              {serviceActionBusy
                ? 'Сохранение…'
                : sheetMode === 'price'
                  ? 'Сохранить цену'
                  : 'Сохранить'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {sheetMode === 'price' ? (
            <AdminFormSheetSection title="Услуга">
              <p className="text-[20px] font-black tracking-[-0.05em] text-[#111827] lg:text-[24px]">
                {title}
              </p>
            </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
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
              className={fieldClass()}
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
              className={fieldClass()}
              placeholder="45"
            />
          </label>
          </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'price' ? (
            <AdminFormSheetSection title="Цена">
            <label className="block">
              <AdminSheetFieldLabel required className={sheetLabelClass}>
                Цена, BYN
              </AdminSheetFieldLabel>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                className={fieldClass()}
                placeholder="45"
                autoFocus
              />
            </label>
            </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' || sheetMode === 'price' ? (
          <AdminFormSheetSection
            title="Тип цены"
            description={sheetMode === 'price' ? 'Как показывать цену в каталоге' : undefined}
          >
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
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
          <AdminFormSheetSection title="Видимость" description="Скрытые услуги не попадают в запись">
            <div className={sheetSegmentWrap}>
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={sheetSegmentClass(isActive)}
              >
                Видна
              </button>

              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={sheetSegmentClass(!isActive)}
              >
                Скрыта
              </button>
            </div>
          </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
          <AdminFormSheetSection title="Описание">
          <label className="block">
            <span className="sr-only">Описание</span>

            <textarea
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              rows={3}
              className={fieldClass()}
              placeholder="Что входит в услугу"
            />
          </label>
          </AdminFormSheetSection>
          ) : null}

          {formError ? (
            <p className="rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
              {formError}
            </p>
          ) : null}
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet
        variant="catalog"
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="Как увидит клиент"
        subtitle="Так услуга в списке на странице мастера при записи"
        footer={
          <button
            type="button"
            onClick={() => setPreviewTarget(null)}
            className={`${catalogSheetPrimaryBtn} w-full`}
          >
            Понятно
          </button>
        }
      >
        {previewTarget ? (
          <AdminFormSheetSection>
            <MasterServiceClientPreview
              service={managedServiceToClientPreview(previewTarget)}
              categoryCode={serviceCategoryCode ?? undefined}
              categoryLabel={draft.category}
              notice={
                previewTarget.isActive === false ? (
                  <p className="rounded-[12px] bg-[#FFF4E8] px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-[#B66A24]">
                    Услуга скрыта — клиенты не увидят её в профиле и не смогут записаться.
                  </p>
                ) : null
              }
            />
          </AdminFormSheetSection>
        ) : null}
      </AdminBottomSheet>

      <AdminBottomSheet
        variant="catalog"
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title={
          deleteTarget && isServiceDeleteBlocked(deleteTarget)
            ? 'Удаление недоступно'
            : 'Удалить услугу?'
        }
        footer={
          deleteTarget && isServiceDeleteBlocked(deleteTarget) ? (
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              className={`${catalogSheetSecondaryBtn} w-full`}
            >
              Понятно
            </button>
          ) : (
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className={catalogSheetSecondaryBtn}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={serviceActionBusy}
                onClick={() => void confirmDelete()}
                className={catalogSheetPrimaryBtn}
              >
                {serviceActionBusy ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          )
        }
      >
        {deleteTarget && isServiceDeleteBlocked(deleteTarget) ? (
          <p className="text-[15px] leading-relaxed text-[#6B7280]">{SERVICE_DELETE_BLOCKED_MESSAGE}</p>
        ) : (
          <p className="text-[15px] leading-relaxed text-[#6B7280]">
            Услуга исчезнет из каталога. Прошлые записи останутся в истории.
          </p>
        )}

        {deleteError && deleteTarget && !isServiceDeleteBlocked(deleteTarget) ? (
          <p className="mt-4 rounded-[10px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">{deleteError}</p>
        ) : null}
      </AdminBottomSheet>

      <AdminBottomSheet
        variant="catalog"
        open={extrasProOpen}
        onClose={() => setExtrasProOpen(false)}
        title="Мастер Pro"
        footer={
          <div className="flex w-full gap-3">
            <button type="button" onClick={() => setExtrasProOpen(false)} className={catalogSheetSecondaryBtn}>
              Позже
            </button>
            <button
              type="button"
              onClick={() => {
                setExtrasProOpen(false);
                navigate(ADMIN_BILLING_PATH);
              }}
              className={catalogSheetPrimaryBtn}
            >
              Перейти к тарифам
            </button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-[#6B7280]">
          На бесплатном тарифе доступны каталог услуг и прайс. Наборы и акции — в подписке «Мастер Pro»: их
          можно создавать, редактировать и показывать клиентам при записи.
        </p>
      </AdminBottomSheet>

      <AdminBottomSheet
        variant="catalog"
        open={freeLimitOpen}
        onClose={() => setFreeLimitOpen(false)}
        title="Лимит Free"
        footer={
          <div className="flex w-full gap-3">
            <button type="button" onClick={() => setFreeLimitOpen(false)} className={catalogSheetSecondaryBtn}>
              Позже
            </button>
            <button
              type="button"
              onClick={() => {
                setFreeLimitOpen(false);
                navigate(ADMIN_BILLING_PATH);
              }}
              className={catalogSheetPrimaryBtn}
            >
              Открыть Pro
            </button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-[#6B7280]">
          На бесплатном тарифе можно добавить до 3 услуг. Откройте Pro, чтобы добавить больше.
        </p>
      </AdminBottomSheet>
    </>
  );
}