import { useCallback, useMemo, useState } from 'react';
import { useSingleFlight } from '../shared/useSingleFlight';
import { useNavigate } from 'react-router-dom';
import type {
  MasterDraft,
  MasterOnboardingService,
} from '../../../features/profile/lib/demoMasterStorage';
import { isFreeServiceLimitReached } from '../../../features/billing/model/masterPlans';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import {
  deleteMasterService,
  patchMasterService,
  postMasterService,
} from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';

type PriceType = 'fixed' | 'from';

type ManagedService = MasterOnboardingService & {
  priceType?: PriceType;
  isActive?: boolean;
  sortOrder?: number;
};

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" strokeLinecap="round" />
      <path d="M9.9 4.24A10.45 10.45 0 0 1 12 4c6.5 0 10 8 10 8a18.65 18.65 0 0 1-2.16 3.19" strokeLinecap="round" />
      <path d="M6.62 6.62C3.63 8.55 2 12 2 12s3.5 8 10 8a10.95 10.95 0 0 0 4.38-.92" strokeLinecap="round" />
    </svg>
  );
}

/** Карточка / экран — предпросмотр для клиента (не путать с видимостью услуги). */
function IconClientPreview({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeLinejoin="round" />
      <path d="M7 9h10M7 13h6" strokeLinecap="round" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="3" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M18 13l-6 6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function newServiceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `svc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldClass(): string {
  return 'mt-1.5 w-full rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] font-semibold text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 transition focus:bg-white focus:shadow-[0_10px_28px_rgba(17,17,17,0.05)]';
}

function iconButtonClass(): string {
  return 'flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-700 transition active:scale-[0.96] disabled:opacity-30';
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [freeLimitOpen, setFreeLimitOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedService | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ManagedService | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const activeCount = services.filter((service) => service.isActive).length;
  const hiddenCount = services.length - activeCount;

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

  const openCreate = useCallback(() => {
    if (isFreeServiceLimitReached(services.length)) {
      setFreeLimitOpen(true);
      return;
    }
    setListError(null);
    resetForm();
    setSheetOpen(true);
  }, [resetForm, services.length]);

  const openEdit = useCallback((service: ManagedService) => {
    setListError(null);
    setEditingId(service.id);
    setTitle(service.title);
    setDur(String(service.durationMin));
    setPrice(String(service.priceByn));
    setPriceType(service.priceType ?? 'fixed');
    setIsActive(service.isActive ?? true);
    setDesc(service.description ?? '');
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    resetForm();
  }, [resetForm]);

  const saveService = useCallback(async () => {
    const preparedTitle = title.trim();
    const preparedDescription = desc.trim();
    const durationNumber = Number.parseInt(dur, 10);
    const priceNumber = Number.parseFloat(price.replace(',', '.').trim());

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

    if (!editingId && isFreeServiceLimitReached(services.length)) {
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
      priceType,
      isActive,
      description: preparedDescription,
      sortOrder: editingId
        ? services.find((service) => service.id === editingId)?.sortOrder ?? services.length
        : services.length,
    };

    const nextServices = editingId
      ? services.map((service) => (service.id === editingId ? nextService : service))
      : [...services, nextService];

    if (!useCabinetApi) {
      persistServices(nextServices, editingId ? 'Услуга обновлена' : 'Услуга добавлена');
      closeSheet();
      return;
    }

    const catId = draft.primaryCategoryId;
    if (!catId) {
      setFormError('Сначала укажите категорию в профиле (основная информация).');
      return;
    }

    setFormError(null);
    try {
      if (editingId && isUuid(editingId)) {
        await patchMasterService(editingId, {
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType,
          isActive,
          sortOrder: nextService.sortOrder ?? 0,
        });
      } else if (!editingId) {
        await postMasterService({
          categoryId: catId,
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType,
          sortOrder: nextService.sortOrder ?? 0,
        });
      } else {
        persistServices(nextServices, editingId ? 'Услуга обновлена' : 'Услуга добавлена');
        closeSheet();
        return;
      }
      await refreshDraft();
      showSuccessToast(editingId ? 'Услуга обновлена' : 'Услуга добавлена');
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
      if (isFreeServiceLimitReached(services.length)) {
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

  return (
    <div className="space-y-4">
      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Каталог
            </p>

            <h2 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
              Услуги
            </h2>

            {listError ? (
              <p className="mt-3 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                {listError}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
              <p className="text-[22px] font-semibold leading-none tracking-[-0.05em] text-neutral-950">
                {activeCount}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-neutral-500">
                видно клиентам
              </p>
            </div>

            <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
              <p className="text-[22px] font-semibold leading-none tracking-[-0.05em] text-neutral-950">
                {hiddenCount}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-neutral-500">
                скрыто
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
          >
            Добавить услугу
          </button>
        </div>
      </section>

      {toast ? (
        <div className="rounded-full bg-[#EAFBF2] px-5 py-3 text-center text-[14px] font-semibold text-[#2F8A5B] shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          {toast}
        </div>
      ) : null}

      {services.length === 0 ? (
        <NothingFoundCard
          title="Услуги пока не добавлены"
          text="Добавьте первую услугу, чтобы клиенты могли выбрать её и записаться."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-[3.15rem] w-full max-w-xs items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
            >
              Добавить услугу
            </button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3 rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
          {services.map((service, index) => (
            <li
              key={service.id}
              className="rounded-[30px] bg-white p-4 shadow-[0_12px_34px_rgba(17,17,17,0.045)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-[19px] font-semibold leading-tight tracking-[-0.045em] text-neutral-950">
                      {service.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        service.isActive
                          ? 'bg-[#EAFBF2] text-[#2F8A5B]'
                          : 'bg-[#F3F1F1] text-neutral-500'
                      }`}
                    >
                      {service.isActive ? 'видно' : 'скрыта'}
                    </span>
                  </div>

                  {service.description ? (
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                      {service.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => void moveService(service.id, -1)}
                    className={iconButtonClass()}
                    aria-label="Поднять услугу выше"
                    title="Выше"
                  >
                    <IconArrowUp />
                  </button>

                  <button
                    type="button"
                    disabled={index === services.length - 1}
                    onClick={() => void moveService(service.id, 1)}
                    className={iconButtonClass()}
                    aria-label="Опустить услугу ниже"
                    title="Ниже"
                  >
                    <IconArrowDown />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
                  <p className="text-[12px] font-medium text-neutral-400">
                    Цена
                  </p>

                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
                    {formatPrice(service)}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
                  <p className="text-[12px] font-medium text-neutral-400">
                    Время
                  </p>

                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
                    {service.durationMin} мин
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-[26px] bg-[#F1EFEF] p-2">
                <button
                  type="button"
                  onClick={() => openEdit(service)}
                  className={iconButtonClass()}
                  aria-label="Редактировать услугу"
                  title="Редактировать"
                >
                  <IconEdit />
                </button>

                <button
                  type="button"
                  onClick={() => void toggleActive(service)}
                  className={iconButtonClass()}
                  aria-label={service.isActive ? 'Скрыть услугу' : 'Показать услугу'}
                  title={service.isActive ? 'Скрыть' : 'Показать'}
                >
                  {service.isActive ? <IconEyeOff /> : <IconEye />}
                </button>

                <button
                  type="button"
                  onClick={() => duplicateService(service)}
                  className={iconButtonClass()}
                  aria-label="Дублировать услугу"
                  title="Дублировать"
                >
                  <IconCopy />
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTarget(service)}
                  className={iconButtonClass()}
                  aria-label="Как услуга выглядит для клиента"
                  title="Предпросмотр"
                >
                  <IconClientPreview />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreviewTarget(null);
                    setDeleteError(null);
                    const svc = service;
                    window.requestAnimationFrame(() => {
                      setDeleteTarget(svc);
                    });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-400 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.05)] transition active:scale-[0.96]"
                  aria-label="Удалить услугу"
                  title="Удалить"
                >
                  <IconTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminBottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingId ? 'Редактировать услугу' : 'Новая услуга'}
      >
        <div className="space-y-4 pb-2">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div>
            <span className="text-[13px] font-semibold text-neutral-500">
              Тип цены
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5">
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
                  className={`min-h-11 rounded-full text-[14px] font-semibold transition active:scale-[0.98] ${
                    priceType === item.id
                      ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                      : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[13px] font-semibold text-neutral-500">
              Видимость
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`min-h-11 rounded-full text-[14px] font-semibold transition active:scale-[0.98] ${
                  isActive
                    ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                    : 'text-neutral-500'
                }`}
              >
                Видна
              </button>

              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`min-h-11 rounded-full text-[14px] font-semibold transition active:scale-[0.98] ${
                  !isActive
                    ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                    : 'text-neutral-500'
                }`}
              >
                Скрыта
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">
              Описание
            </span>

            <textarea
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              rows={3}
              className={fieldClass()}
              placeholder="Что входит в услугу"
            />
          </label>

          {formError ? (
            <p className="rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
              {formError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={serviceActionBusy}
            onClick={() => void saveService()}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {serviceActionBusy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="Как увидит клиент"
      >
        {previewTarget ? (
          <div className="pb-2">
            <div className="rounded-[32px] bg-[#F1EFEF] p-3">
              <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
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

                  <p className="shrink-0 rounded-full bg-[#F1EFEF] px-5 py-3 text-center text-[13px] font-semibold text-neutral-600">
                    Так карточку увидит клиент в поиске
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewTarget(null)}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              Закрыть
            </button>
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
    </div>
  );
}