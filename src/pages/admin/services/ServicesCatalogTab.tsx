import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';
import { HiArrowTopRightOnSquare, HiChevronLeft, HiChevronRight, HiFunnel, HiMagnifyingGlass } from 'react-icons/hi2';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCatalogAddBtnHeader,
  servicesCatalogFilterBtnActive,
  servicesCatalogFilterBtnText,
  servicesCatalogGridCanvas,
  servicesCatalogPreviewBtn,
  servicesCatalogSearchInput,
  servicesCatalogSlotsAlert,
  servicesCatalogToolbarSelect,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { ADMIN_ATTENTION_EXCLAMATION_ICON_SRC } from '../shared/AdminSectionAttentionBadge';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from './ServicesTabFab';
import { CatalogServiceCard } from './ServicesCatalogServiceCard';
import { filterCatalogServices } from './catalogFilterUtils';
import type { ManagedService } from './servicesFormat';
import { serviceCatalogThumbnailUrl } from './servicesFormat';
import { CatalogActiveFiltersBar } from './CatalogActiveFiltersBar';
import { catalogSortSelectOptions, getActiveCatalogFilterChips } from './catalogFilterLabels';
import {
  catalogFiltersAreActive,
  DEFAULT_CATALOG_FILTERS,
  ServicesCatalogFiltersSheet,
  type CatalogFiltersState,
} from './ServicesCatalogFiltersSheet';
import { countVisibleServicesWithoutSlots } from './servicesCatalogAttention';
import { reorderManagedServiceList } from './servicesCatalogReorder';
import { ServicesCatalogViewToggle, type CatalogViewMode } from './ServicesCatalogViewToggle';
import { useCatalogServiceDragReorder } from './useCatalogServiceDragReorder';
import {
  loadServicesCatalogPrefs,
  saveServicesCatalogPrefs,
} from './servicesCatalogPrefsStorage';

type ServiceStats = {
  serviceId: string;
  availableSlotsCount: number;
  upcomingAppointmentsCount: number;
};

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onAdd: () => void;
  onOpenMenu: (service: ManagedService) => void;
  onEdit?: (service: ManagedService) => void;
  onReorder?: (activeId: string, overId: string) => void;
  serviceStats?: ServiceStats[];
  categoryLabel?: string | null;
  masterId?: string | null;
  hasAnySlots?: boolean;
  slotsStatsReady?: boolean;
};

const CATALOG_PAGE_SIZE = 10;

function pluralServicesInCatalog(count: number): string {
  if (count === 1) return '1 услуга в каталоге';
  if (count < 5) return `${count} услуги в каталоге`;
  return `${count} услуг в каталоге`;
}

function pluralServicesWithoutSlots(count: number): string {
  if (count === 1) return '1 услуга без времени для записи';
  if (count < 5) return `${count} услуги без времени для записи`;
  return `${count} услуг без времени для записи`;
}

function CatalogPagination({
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
  const from = page * CATALOG_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * CATALOG_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы каталога"
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

export function ServicesCatalogTab({
  draft,
  services,
  onAdd,
  onOpenMenu,
  onEdit,
  onReorder,
  serviceStats = [],
  categoryLabel,
  masterId,
  hasAnySlots = true,
  slotsStatsReady = true,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFiltersState>(DEFAULT_CATALOG_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CatalogViewMode>(() =>
    loadServicesCatalogPrefs(masterId).viewMode,
  );
  const [page, setPage] = useState(0);

  useEffect(() => {
    setViewMode(loadServicesCatalogPrefs(masterId).viewMode);
  }, [masterId]);

  useEffect(() => {
    saveServicesCatalogPrefs(masterId, { viewMode });
  }, [masterId, viewMode]);

  const filtered = useMemo(
    () => filterCatalogServices(services, query, filters),
    [filters, query, services],
  );

  const filterIsActive = catalogFiltersAreActive(filters);
  const activeFilterChips = useMemo(() => getActiveCatalogFilterChips(filters), [filters]);

  const priceSuggestions = useMemo(() => {
    const prices = [
      ...new Set(
        services
          .map((s) => (Number.isFinite(s.priceByn) ? Math.round(s.priceByn) : 0))
          .filter((p) => p > 0),
      ),
    ].sort((a, b) => a - b);
    return prices.slice(0, 8);
  }, [services]);

  useEffect(() => {
    setPage(0);
  }, [query, filters]);

  const patchFilters = (patch: Partial<CatalogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const statsById = useMemo(() => new Map(serviceStats.map((s) => [s.serviceId, s])), [serviceStats]);

  const canReorder =
    Boolean(onReorder) &&
    masterWrite.canMutate &&
    filters.sort === 'catalog' &&
    !filterIsActive &&
    !query.trim();

  const servicesWithoutSlotsCount = useMemo(
    () => countVisibleServicesWithoutSlots(services, serviceStats),
    [serviceStats, services],
  );

  const sortSelectOptions = useMemo(() => catalogSortSelectOptions(), []);

  const handleReorder = useCallback(
    (activeId: string, overId: string) => {
      onReorder?.(activeId, overId);
    },
    [onReorder],
  );

  const { draggingId, overId, isDragging, onHandlePointerDown } = useCatalogServiceDragReorder({
    enabled: canReorder,
    onReorder: handleReorder,
  });

  const displayList = useMemo(() => {
    if (!isDragging || !draggingId || !overId || draggingId === overId) {
      return filtered;
    }
    return reorderManagedServiceList(filtered, draggingId, overId) ?? filtered;
  }, [filtered, draggingId, isDragging, overId]);

  const pageCount = Math.max(1, Math.ceil(displayList.length / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * CATALOG_PAGE_SIZE;
    return displayList.slice(start, start + CATALOG_PAGE_SIZE);
  }, [displayList, safePage]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
              Каталог услуг
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280] sm:text-[14px]">
              {pluralServicesInCatalog(services.length)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <MasterPublicPreviewLink
              masterId={masterId}
              ready={hasAnySlots}
              variant="secondary"
              className={`${servicesCatalogPreviewBtn} min-w-0`}
            />
            <button
              type="button"
              onClick={onAdd}
              disabled={!masterWrite.canMutate}
              title={masterWrite.mutateDisabledTitle}
              className={servicesCatalogAddBtnHeader}
            >
              Добавить услугу +
            </button>
          </div>
        </div>

        {slotsStatsReady && servicesWithoutSlotsCount > 0 ? (
          <div className={servicesCatalogSlotsAlert} role="status">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80">
                <SlottyImg
                  src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
                  alt=""
                  className="h-5 w-5 object-contain"
                  decoding="async"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#111827]">
                  {pluralServicesWithoutSlots(servicesWithoutSlotsCount)}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280] sm:text-[13px]">
                  Клиенты видят их в каталоге, но не могут выбрать дату и время.
                </p>
              </div>
            </div>
            <Link
              to={ADMIN_SCHEDULE_PATH}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#F47C8C] transition hover:opacity-90"
            >
              Перейти в расписание
              <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-0 flex-1 sm:min-w-[12rem]">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
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
            aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры каталога'}
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
              value={filters.sort}
              onChange={(value) => patchFilters({ sort: value as CatalogFiltersState['sort'] })}
              options={sortSelectOptions}
              aria-label="Сортировка"
              sheetTitle="Сортировка"
            />
          </div>
          <ServicesCatalogViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <CatalogActiveFiltersBar
        filters={filters}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
      />

      {filtered.length === 0 ? (
        <div className={`${profileDashboardCard} p-6 text-center`}>
          <MiniPicture
            name={services.length === 0 ? 'servicesEmpty' : 'searchEmpty'}
            variant="empty"
            className="mb-2"
          />
          <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {services.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте первую услугу. Например: маникюр, стрижка, массаж или консультация.'
              : activeFilterChips.length > 0
                ? `По фильтрам «${activeFilterChips.map((c) => c.label).join('», «')}» ничего не нашлось. Ослабьте условия или сбросьте фильтры.`
                : 'Попробуйте другой запрос'}
          </p>
          {services.length > 0 && activeFilterChips.length > 0 ? (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_CATALOG_FILTERS)}
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
            } ${isDragging ? 'select-none' : ''}`}
          >
            {pageItems.map((service) => {
              const stats = statsById.get(service.id);
              return (
              <CatalogServiceCard
                key={service.id}
                service={service}
                layout={viewMode}
                imageSrc={serviceCatalogThumbnailUrl(service, draft)}
                categoryLabel={categoryLabel}
                availableSlotsCount={stats?.availableSlotsCount}
                upcomingAppointmentsCount={stats?.upcomingAppointmentsCount ?? 0}
                slotsStatsReady={slotsStatsReady}
                onOpenMenu={onOpenMenu}
                onEdit={onEdit}
                showDragHandle={canReorder}
                isDragSource={draggingId === service.id}
                isDragOver={overId === service.id && draggingId !== service.id}
                onDragHandlePointerDown={(event) => onHandlePointerDown(service.id, event)}
              />
            );
            })}
          </ul>
          {filtered.length > CATALOG_PAGE_SIZE ? (
            <CatalogPagination
              page={safePage}
              pageCount={pageCount}
              total={filtered.length}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        filters={filters}
        resultCount={filtered.length}
        totalCount={services.length}
        priceSuggestions={priceSuggestions}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
        onClose={() => setFilterOpen(false)}
      />
      </div>

      <ServicesTabFab
        ariaLabel="Добавить услугу"
        onClick={onAdd}
        disabled={!masterWrite.canMutate}
        disabledTitle={masterWrite.mutateDisabledTitle}
      />
    </div>
  );
}
