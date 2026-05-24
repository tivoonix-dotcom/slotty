import { useCallback, useEffect, useMemo, useState } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { useSingleFlight } from '../shared/useSingleFlight';
import { useNavigate } from 'react-router-dom';
import type {
  MasterDraft,
  MasterOnboardingService,
} from '../../../features/profile/lib/demoMasterStorage';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import {
  deleteMasterService,
  patchMasterService,
  postMasterService,
} from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import {
  adminSheetBodyPad,
  adminSheetPinkBtn,
  adminSheetSegmentActive,
  adminSheetSegmentIdle,
  adminSheetSegmentWrap,
} from '../shared/adminCabinetSheetTheme';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import {
  SERVICES_PAGE_BG,
  servicesDesktopCard,
  servicesDesktopTabsSticky,
  servicesInput,
  servicesShellCard,
} from './adminServicesTheme';
import { ServicesSectionTabs } from './ServicesSectionTabs';
import { computeServicesTabMetrics } from './servicesTabMetrics';
import { ServicesBundlesTab } from './ServicesBundlesTab';
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
import { loadServiceBundles, loadServicePromotions, saveServiceBundles, saveServicePromotions } from './servicesStorage';
import type { ServiceBundle, ServicePromotion, ServicesTabId } from './servicesTypes';

type PriceType = 'fixed' | 'from';

type ServiceSheetMode = 'create' | 'full' | 'price' | 'duration';

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
  return `${servicesInput} mt-1.5`;
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

function formatPrice(service: ManagedService): string {
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${service.priceByn} BYN`;
}

function reindexServices(list: ManagedService[]): ManagedService[] {
  return list.map((service, index) => ({
    ...service,
    sortOrder: index,
  }));
}

export function AdminServicesTab({ draft, onPersist }: Props) {
  const navigate = useNavigate();
  const { useCabinetApi, refreshDraft, commitDraftBaseline } = useAdminMasterCabinet();
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
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ServicesTabId>('catalog');
  const [menuTarget, setMenuTarget] = useState<ManagedService | null>(null);
  const [bundles, setBundles] = useState<ServiceBundle[]>(() => loadServiceBundles());
  const [promotions, setPromotions] = useState<ServicePromotion[]>(() => loadServicePromotions());
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [promoFormOpen, setPromoFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<ServicePromotion | null>(null);

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
    void reloadServiceExtras();
  }, [reloadServiceExtras]);

  const [title, setTitle] = useState('');
  const [dur, setDur] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [isActive, setIsActive] = useState(true);
  const [desc, setDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { busy: serviceActionBusy, run: runServiceAction } = useSingleFlight();

  const services = useMemo(
    () =>
      draft.services
        .map((service, index) => normalizeService(service, index))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.services],
  );

  const persistServices = useCallback(
    (nextServices: ManagedService[], message?: string) => {
      onPersist({
        ...draft,
        services: reindexServices(nextServices),
      });

      if (message) {
        setToast(message);
        window.setTimeout(() => setToast(null), 1800);
      }
    },
    [draft, onPersist],
  );

  const showSuccessToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setDur('');
    setPrice('');
    setPriceType('fixed');
    setIsActive(true);
    setDesc('');
    setFormError(null);
  }, []);

  const loadServiceIntoForm = useCallback((service: ManagedService) => {
    setEditingId(service.id);
    setTitle(service.title);
    setDur(String(service.durationMin));
    setPrice(String(service.priceByn));
    setPriceType(service.priceType ?? 'fixed');
    setIsActive(service.isActive ?? true);
    setDesc(service.description ?? '');
    setFormError(null);
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

  const openEditDuration = useCallback(
    (service: ManagedService) => openEdit(service, 'duration'),
    [openEdit],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    resetForm();
  }, [resetForm]);

  const saveService = useCallback(async () => {
    const existing = editingId ? services.find((service) => service.id === editingId) : undefined;
    const quickPrice = sheetMode === 'price' && Boolean(existing);
    const quickDuration = sheetMode === 'duration' && Boolean(existing);

    let preparedTitle = title.trim();
    let preparedDescription = desc.trim();
    let durationNumber = Number.parseInt(dur, 10);
    let priceNumber = Number.parseFloat(price.replace(',', '.').trim());
    let activeFlag = isActive;
    let priceTypeValue = priceType;

    if (quickPrice && existing) {
      preparedTitle = existing.title;
      preparedDescription = existing.description ?? '';
      durationNumber = existing.durationMin;
      activeFlag = existing.isActive ?? true;
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        setFormError('Укажите цену. Можно 0.');
        return;
      }
    } else if (quickDuration && existing) {
      preparedTitle = existing.title;
      preparedDescription = existing.description ?? '';
      priceNumber = existing.priceByn;
      priceTypeValue = existing.priceType ?? 'fixed';
      activeFlag = existing.isActive ?? true;
      if (!Number.isInteger(durationNumber) || durationNumber <= 0) {
        setFormError('Укажите длительность в минутах.');
        return;
      }
    } else {
      if (!preparedTitle) {
        setFormError('Укажите название услуги.');
        return;
      }

      if (!Number.isInteger(durationNumber) || durationNumber <= 0) {
        setFormError('Укажите длительность в минутах.');
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
        : quickDuration
          ? 'Длительность обновлена'
          : editingId
            ? 'Услуга обновлена'
            : 'Услуга добавлена';
      persistServices(nextServices, okMsg);
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
      : quickDuration
        ? 'Длительность обновлена'
        : editingId
          ? 'Услуга обновлена'
          : 'Услуга добавлена';

    setFormError(null);
    try {
      if (editingId && isUuid(editingId)) {
        await patchMasterService(editingId, {
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType: priceTypeValue,
          isActive: activeFlag,
          sortOrder: nextService.sortOrder ?? 0,
        });
      } else if (!editingId) {
        await postMasterService({
          categoryId: catId,
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType: priceTypeValue,
          sortOrder: nextService.sortOrder ?? 0,
        });
      } else {
        persistServices(nextServices, okMsg);
        closeSheet();
        return;
      }
      await refreshDraft();
      showSuccessToast(okMsg);
      closeSheet();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
    });
  }, [
    closeSheet,
    desc,
    draft.primaryCategoryId,
    dur,
    editingId,
    isActive,
    persistServices,
    price,
    priceType,
    refreshDraft,
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

      setListError(null);
      try {
        await patchMasterService(service.id, { isActive: !service.isActive });
        await refreshDraft();
        showSuccessToast(service.isActive ? 'Услуга скрыта' : 'Услуга снова видна');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [persistServices, refreshDraft, services, showSuccessToast, useCabinetApi],
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
        title: `${service.title} копия`,
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

      setFormError(null);
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
        await patchMasterService(created.id, { isActive: false });
        await refreshDraft();
        showSuccessToast('Услуга продублирована');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [draft.primaryCategoryId, persistServices, refreshDraft, services, showSuccessToast, useCabinetApi],
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

      const reindexed = reindexServices(nextServices);

      if (!useCabinetApi) {
        persistServices(reindexed, 'Порядок обновлен');
        return;
      }

      setListError(null);
      try {
        const prevById = new Map(services.map((s) => [s.id, s]));
        const patches: Promise<unknown>[] = [];
        for (const s of reindexed) {
          if (!isUuid(s.id)) continue;
          const old = prevById.get(s.id);
          if (!old || (old.sortOrder ?? 0) === (s.sortOrder ?? 0)) continue;
          patches.push(patchMasterService(s.id, { sortOrder: s.sortOrder ?? 0 }));
        }
        await Promise.all(patches);
        await refreshDraft();
        showSuccessToast('Порядок обновлен');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    },
    [persistServices, refreshDraft, services, showSuccessToast, useCabinetApi],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

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
        const filtered = reindexServices(services.filter((service) => service.id !== deleteTarget.id));
        commitDraftBaseline({ ...draft, services: filtered });
        setDeleteTarget(null);
        setDeleteError(null);
        showSuccessToast('Услуга удалена');
        void refreshDraft();
      } else {
        persistServices(services.filter((service) => service.id !== deleteTarget.id), 'Услуга удалена');
        setDeleteTarget(null);
        setDeleteError(null);
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Не удалось удалить');
    }
    });
  }, [commitDraftBaseline, deleteTarget, draft, persistServices, refreshDraft, runServiceAction, services, showSuccessToast, useCabinetApi]);

  const persistPromotionsLocal = useCallback((rows: ServicePromotion[]) => {
    setPromotions(rows);
    saveServicePromotions(rows);
  }, []);

  const persistBundlesLocal = useCallback((rows: ServiceBundle[]) => {
    setBundles(rows);
    saveServiceBundles(rows);
  }, []);

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
        if (exists && isUuid(bundle.id)) {
          await patchMasterBundle(bundle.id, body);
        } else {
          await postMasterBundle(body);
        }
        await reloadServiceExtras();
        showSuccessToast(toastMsg);
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить набор');
        throw e;
      }
    },
    [bundles, extrasLocked, persistBundlesLocal, reloadServiceExtras, showSuccessToast, useCabinetApi],
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
      await reloadServiceExtras();
      showSuccessToast('Набор удалён');
    },
    [bundles, extrasLocked, persistBundlesLocal, reloadServiceExtras, showSuccessToast, useCabinetApi],
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
        const exists = editingPromo && isUuid(editingPromo.id);
        if (exists) {
          await patchMasterPromotion(editingPromo.id, body);
        } else {
          await postMasterPromotion(body);
        }
        await reloadServiceExtras();
        setPromoFormOpen(false);
        setEditingPromo(null);
        showSuccessToast(publish ? 'Акция опубликована' : 'Черновик сохранён');
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Не удалось сохранить акцию');
      }
    },
    [editingPromo, extrasLocked, persistPromotionsLocal, promotions, reloadServiceExtras, showSuccessToast, useCabinetApi],
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
      await reloadServiceExtras();
      showSuccessToast('Акция удалена');
    },
    [extrasLocked, persistPromotionsLocal, promotions, reloadServiceExtras, showSuccessToast, useCabinetApi],
  );

  const menuIndex = menuTarget ? services.findIndex((s) => s.id === menuTarget.id) : -1;

  const tabMetrics = useMemo(
    () => computeServicesTabMetrics(services, bundles, promotions),
    [bundles, promotions, services],
  );

  const statusAlerts = (
    <>
      {listError || extrasError ? (
        <p className="rounded-[16px] border border-[#FDE8ED] bg-[#FFF1F4] px-4 py-3 text-[14px] font-semibold text-[#B45309] lg:rounded-[20px]">
          {listError ?? extrasError}
        </p>
      ) : null}

      {toast ? (
        <div className="rounded-full bg-[#ECFDF5] px-5 py-3 text-center text-[14px] font-semibold text-[#16A34A] shadow-sm">
          {toast}
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
          />
      ) : null}
      {activeTab === 'price' ? (
        <ServicesPriceTab
            draft={draft}
            services={services}
            onEditPrice={openEditPrice}
            onEditDuration={openEditDuration}
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
          onSave={saveBundle}
          onDelete={deleteBundle}
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
        className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 pb-[calc(5.75rem+1.25rem)] lg:hidden ${SERVICES_PAGE_BG}`}
      >
        <ServicesPageHeader activeTab={activeTab} metrics={tabMetrics} />
        {statusAlerts}
        <AdminTabContentTransition activeKey={activeTab}>{tabPanels}</AdminTabContentTransition>
      </section>

      <div className={`${servicesShellCard} space-y-6`}>
        <div className={`${servicesDesktopCard} ${servicesDesktopTabsSticky}`}>
          <ServicesSectionTabs active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="min-w-0 space-y-6">
          <ServicesPageHeader activeTab={activeTab} metrics={tabMetrics} />
          {statusAlerts}
          <AdminTabContentTransition activeKey={activeTab} className="min-w-0 space-y-6">
            {tabPanels}
          </AdminTabContentTransition>
        </div>
      </div>

      <ServicesServiceMenuSheet
        open={Boolean(menuTarget)}
        service={menuTarget}
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
        onMoveUp={() => {
          if (menuTarget) void moveService(menuTarget.id, -1);
          setMenuTarget(null);
        }}
        onMoveDown={() => {
          if (menuTarget) void moveService(menuTarget.id, 1);
          setMenuTarget(null);
        }}
        onDelete={() => {
          if (menuTarget) {
            setDeleteError(null);
            setDeleteTarget(menuTarget);
          }
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

      <AdminBottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={
          sheetMode === 'create'
            ? 'Новая услуга'
            : sheetMode === 'price'
              ? 'Изменить цену'
              : sheetMode === 'duration'
                ? 'Изменить длительность'
                : editingId
                  ? 'Редактировать услугу'
                  : 'Новая услуга'
        }
        subtitle={
          sheetMode === 'price'
            ? 'Быстрое изменение — сразу попадёт в каталог и запись'
            : sheetMode === 'duration'
              ? 'Длительность влияет на свободные слоты в календаре'
              : sheetMode === 'create'
                ? 'Заполните основное — карточку можно донастроить позже'
                : 'Изменения сразу отобразятся в каталоге'
        }
        badge={
          sheetMode === 'price'
            ? 'Прайс'
            : sheetMode === 'duration'
              ? 'Время'
              : sheetMode === 'create'
                ? 'Новая услуга'
                : 'Каталог'
        }
        footer={
          <button
            type="button"
            disabled={serviceActionBusy}
            onClick={() => void saveService()}
            className={adminSheetPinkBtn}
          >
            {serviceActionBusy
              ? 'Сохранение…'
              : sheetMode === 'price'
                ? 'Сохранить цену'
                : sheetMode === 'duration'
                  ? 'Сохранить длительность'
                  : 'Сохранить'}
          </button>
        }
      >
        <div className={`${adminSheetBodyPad} space-y-5 lg:space-y-6`}>
          {sheetMode === 'price' || sheetMode === 'duration' ? (
            <AdminFormSheetSection title="Услуга">
              <p className="text-[20px] font-black tracking-[-0.05em] text-[#111827] lg:text-[24px]">
                {title}
              </p>
            </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
          <AdminFormSheetSection title="Основное" description="Название и параметры для клиентов">
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">
              Название услуги *
            </span>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass()}
              placeholder="Маникюр с покрытием"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">
                Длительность *
              </span>

              <input
                value={dur}
                onChange={(event) => setDur(event.target.value)}
                inputMode="numeric"
                className={fieldClass()}
                placeholder="60"
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">
                Цена, BYN *
              </span>

              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                className={fieldClass()}
                placeholder="45"
              />
            </label>
          </div>
          </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'duration' ? (
            <AdminFormSheetSection title="Длительность">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">Длительность, мин *</span>
              <input
                value={dur}
                onChange={(event) => setDur(event.target.value)}
                inputMode="numeric"
                className={fieldClass()}
                placeholder="60"
                autoFocus
              />
            </label>
            </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'price' ? (
            <AdminFormSheetSection title="Цена">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">Цена, BYN *</span>
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
            <div className={adminSheetSegmentWrap}>
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
                  className={
                    priceType === item.id ? adminSheetSegmentActive : adminSheetSegmentIdle
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
          <AdminFormSheetSection title="Видимость" description="Скрытые услуги не попадают в запись">
            <div className={adminSheetSegmentWrap}>
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={isActive ? adminSheetSegmentActive : adminSheetSegmentIdle}
              >
                Видна
              </button>

              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={!isActive ? adminSheetSegmentActive : adminSheetSegmentIdle}
              >
                Скрыта
              </button>
            </div>
          </AdminFormSheetSection>
          ) : null}

          {sheetMode === 'full' || sheetMode === 'create' ? (
          <AdminFormSheetSection title="Описание" description="Необязательно — помогает клиенту выбрать услугу">
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
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="Как увидит клиент"
        subtitle="Так карточка выглядит в поиске и при записи"
        badge="Превью"
        footer={
          <button
            type="button"
            onClick={() => setPreviewTarget(null)}
            className={adminSheetPinkBtn}
          >
            Понятно
          </button>
        }
      >
        {previewTarget ? (
          <div className={adminSheetBodyPad}>
          <AdminFormSheetSection>
            <div className="rounded-[24px] bg-[#f6f7fb] p-4 lg:p-5">
            <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_28px_rgba(17,24,39,0.06)] lg:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-semibold tracking-[-0.045em] text-neutral-950">
                      {previewTarget.title}
                    </p>

                    <p className="mt-1 text-[14px] font-medium text-neutral-400">
                      {previewTarget.durationMin} мин
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                      previewTarget.isActive
                        ? 'bg-[#EAFBF2] text-[#2F8A5B]'
                        : 'bg-[#F3F1F1] text-neutral-500'
                    }`}
                  >
                    {previewTarget.isActive ? 'видно' : 'скрыта'}
                  </span>
                </div>

                {previewTarget.description ? (
                  <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
                    {previewTarget.description}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[22px] font-semibold tracking-[-0.05em] text-neutral-950">
                    {formatPrice(previewTarget)}
                  </p>

                </div>
              </div>
            </div>
          </AdminFormSheetSection>
          </div>
        ) : null}
      </AdminBottomSheet>

      <AdminBottomSheet
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title="Удалить услугу?"
      >
        <p className="text-[15px] leading-relaxed text-neutral-600">
          Если на услугу уже есть будущие записи, они останутся в календаре. Новые клиенты больше не смогут выбрать эту услугу.
        </p>

        {deleteError ? (
          <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">{deleteError}</p>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={serviceActionBusy}
            onClick={() => void confirmDelete()}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {serviceActionBusy ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet open={extrasProOpen} onClose={() => setExtrasProOpen(false)} title="Наборы и акции в Pro">
        <p className="text-[15px] leading-relaxed text-neutral-600">
          На тарифе Free доступны каталог и прайс. Наборы услуг и акции открываются после подключения Pro.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setExtrasProOpen(false)}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            Позже
          </button>
          <button
            type="button"
            onClick={() => {
              setExtrasProOpen(false);
              navigate(ADMIN_BILLING_PATH);
            }}
            className="flex min-h-12 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Подключить Pro
          </button>
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet open={freeLimitOpen} onClose={() => setFreeLimitOpen(false)} title="Лимит Free">
        <p className="text-[15px] leading-relaxed text-neutral-600">
          На бесплатном тарифе можно добавить до 3 услуг. Откройте Pro, чтобы добавить больше.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setFreeLimitOpen(false)}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            Позже
          </button>
          <button
            type="button"
            onClick={() => {
              setFreeLimitOpen(false);
              navigate(ADMIN_BILLING_PATH);
            }}
            className="flex min-h-12 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Открыть Pro
          </button>
        </div>
      </AdminBottomSheet>
    </>
  );
}