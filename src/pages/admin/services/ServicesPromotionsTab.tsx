import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiFunnel, HiMagnifyingGlass } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogFilterChipClass,
  catalogFilterSectionClass,
  catalogSheetPrimaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import {
  servicesCatalogAddBtnHeader,
  servicesCatalogFilterBtnActive,
  servicesCatalogFilterBtnText,
  servicesCatalogGridCanvas,
  servicesCatalogSearchInput,
  servicesCatalogToolbarSelect,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus } from './servicesFormat';
import { normalizePromotion } from './promotionNormalize';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';
import { PromotionBannerCard } from './PromotionBannerCard';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesPromotionMenuSheet } from './ServicesPromotionMenuSheet';
import { ServicesCatalogViewToggle, type CatalogViewMode } from './ServicesCatalogViewToggle';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  promotions: ServicePromotion[];
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onCreate: () => void;
  onEdit: (promo: ServicePromotion) => void;
  onDelete: (id: string) => void;
};

type PromoSort = 'default' | 'title' | 'starts_asc' | 'starts_desc';
type PromoStatusFilter = 'all' | ServicePromotionStatus;

const PROMO_PAGE_SIZE = 10;

const SORT_OPTIONS: Array<{ value: PromoSort; label: string }> = [
  { value: 'default', label: 'Сортировка: По умолчанию' },
  { value: 'title', label: 'Сортировка: По названию' },
  { value: 'starts_asc', label: 'Сортировка: Раньше начинаются' },
  { value: 'starts_desc', label: 'Сортировка: Позже начинаются' },
];

const STATUS_OPTIONS: Array<{ id: PromoStatusFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'scheduled', label: 'Запланированные' },
  { id: 'finished', label: 'Завершённые' },
  { id: 'draft', label: 'Черновики' },
];

function pluralPromotions(count: number): string {
  if (count === 1) return '1 акция в каталоге';
  if (count < 5) return `${count} акции в каталоге`;
  return `${count} акций в каталоге`;
}

function sortPromotions<T extends { title: string; createdAt: string; startsAt: string }>(
  list: T[],
  sort: PromoSort,
): T[] {
  const copy = [...list];
  switch (sort) {
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    case 'starts_asc':
      return copy.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    case 'starts_desc':
      return copy.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

function PromoPagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (next: number) => void;
}) {
  const from = page * PROMO_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PROMO_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы акций"
    >
      <p className="text-[13px] font-semibold text-[#6B7280]">
        {from}–{to} из {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#F5F5F5] px-3 text-[13px] font-semibold text-[#374151] transition enabled:hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HiChevronLeft className="h-4 w-4" aria-hidden />
          Назад
        </button>
        <span className="min-w-[4.5rem] text-center text-[13px] font-bold tabular-nums text-[#111827]">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#F5F5F5] px-3 text-[13px] font-semibold text-[#374151] transition enabled:hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Вперёд
          <HiChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export function ServicesPromotionsTab({
  draft,
  services,
  promotions,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [menuPromo, setMenuPromo] = useState<ServicePromotion | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PromoSort>('default');
  const [statusFilter, setStatusFilter] = useState<PromoStatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CatalogViewMode>('list');
  const [page, setPage] = useState(0);

  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const rows = useMemo(() => {
    return promotions.map((promo) => {
      const normalized = normalizePromotion(promo);
      const serviceTitle =
        normalized.serviceTitle ||
        services.find((service) => service.id === normalized.serviceId)?.title ||
        '';

      return {
        ...normalized,
        serviceTitle,
        status: derivePromotionStatus(normalized),
      };
    });
  }, [promotions, services]);

  const filterIsActive = statusFilter !== 'all';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (statusFilter !== 'all') {
      list = list.filter((promo) => promo.status === statusFilter);
    }
    if (q) {
      list = list.filter((promo) => {
        if (promo.title.toLowerCase().includes(q)) return true;
        if (promo.serviceTitle.toLowerCase().includes(q)) return true;
        if (promo.description?.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return sortPromotions(list, sort);
  }, [query, rows, sort, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PROMO_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * PROMO_PAGE_SIZE;
    return filtered.slice(start, start + PROMO_PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [query, sort, statusFilter]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const tryCreate = () => {
    if (extrasLocked) {
      connectPro();
      return;
    }
    onCreate();
  };

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="promotions"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
              Акции
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280] sm:text-[14px]">
              {promotions.length > 0
                ? pluralPromotions(promotions.length)
                : 'Скидки и спецпредложения для клиентов'}
            </p>
          </div>
          <button
            type="button"
            onClick={tryCreate}
            disabled={!masterWrite.canMutate}
            title={masterWrite.mutateDisabledTitle}
            className={`${servicesCatalogAddBtnHeader} shrink-0 self-start`}
          >
            Создать акцию +
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative min-w-0 flex-1 sm:min-w-[12rem]">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск акции"
                className={servicesCatalogSearchInput}
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className={`${servicesCatalogFilterBtnText} ${
                  filterIsActive ? servicesCatalogFilterBtnActive : 'bg-[#EBEBEB] text-[#374151]'
                }`}
                aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры акций'}
                aria-expanded={filterOpen}
              >
                <HiFunnel className="h-5 w-5 shrink-0" aria-hidden />
                Фильтры
                {filterIsActive ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" aria-hidden />
                ) : null}
              </button>
              <div className={`hidden min-w-[11rem] sm:block ${servicesCatalogToolbarSelect}`}>
                <SlottySelect
                  tone="catalog"
                  value={sort}
                  onChange={(value) => setSort(value as PromoSort)}
                  options={SORT_OPTIONS}
                  aria-label="Сортировка"
                  sheetTitle="Сортировка"
                />
              </div>
              <ServicesCatalogViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className={`${profileDashboardCard} p-6 text-center`}>
            <MiniPicture name="servicesEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Акций пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              Запустите скидку на услугу — она появится в каталоге и при записи.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${profileDashboardCard} p-6 text-center`}>
            <MiniPicture name="searchEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Ничего не найдено
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              Попробуйте другой запрос или сбросьте фильтры
            </p>
            {filterIsActive ? (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="mt-4 text-[14px] font-semibold text-[#F47C8C]"
              >
                Сбросить фильтры
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <ul
              className={`w-full max-w-none ${
                viewMode === 'grid'
                  ? `${servicesCatalogGridCanvas} grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3`
                  : 'flex flex-col gap-2.5 lg:gap-3'
              }`}
            >
              {pageItems.map((promo) => (
                <PromotionBannerCard
                  key={promo.id}
                  as="li"
                  layout={viewMode}
                  promo={promo}
                  onMenu={() => setMenuPromo(promo)}
                />
              ))}
            </ul>
            {filtered.length > PROMO_PAGE_SIZE ? (
              <PromoPagination
                page={safePage}
                pageCount={pageCount}
                total={filtered.length}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>

      <AdminBottomSheet
        variant="catalog"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Фильтры акций"
        footer={
          <button type="button" className={catalogSheetPrimaryBtn} onClick={() => setFilterOpen(false)}>
            Готово
          </button>
        }
      >
        <section className={catalogFilterSectionClass}>
          <p className={sheetSectionTitleClass}>Статус</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Статус акции">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                aria-pressed={statusFilter === option.id}
                className={catalogFilterChipClass(statusFilter === option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </AdminBottomSheet>

      <ServicesPromotionMenuSheet
        open={Boolean(menuPromo)}
        promo={menuPromo}
        onClose={() => setMenuPromo(null)}
        onEdit={() => {
          if (menuPromo) onEdit(menuPromo);
          setMenuPromo(null);
        }}
        onDelete={() => {
          if (menuPromo) onDelete(menuPromo.id);
          setMenuPromo(null);
        }}
      />
    </div>
  );
}
