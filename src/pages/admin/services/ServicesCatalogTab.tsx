import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';
import { HiChevronLeft, HiChevronRight, HiFunnel, HiMagnifyingGlass } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCatalogFilterBtn,
  servicesCatalogFilterBtnActive,
  servicesCatalogSearchInput,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from './ServicesTabFab';
import { CatalogServiceCard } from './ServicesCatalogServiceCard';
import { filterCatalogServices } from './catalogFilterUtils';
import type { ManagedService } from './servicesFormat';
import { serviceCatalogThumbnailUrl } from './servicesFormat';
import { CatalogActiveFiltersBar } from './CatalogActiveFiltersBar';
import { getActiveCatalogFilterChips } from './catalogFilterLabels';
import {
  catalogFiltersAreActive,
  DEFAULT_CATALOG_FILTERS,
  ServicesCatalogFiltersSheet,
  type CatalogFiltersState,
} from './ServicesCatalogFiltersSheet';

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
  serviceStats?: ServiceStats[];
  categoryLabel?: string | null;
  masterId?: string | null;
  hasAnySlots?: boolean;
};

const CATALOG_PAGE_SIZE = 10;

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
  serviceStats = [],
  categoryLabel,
  masterId,
  hasAnySlots = true,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFiltersState>(DEFAULT_CATALOG_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => filterCatalogServices(services, query, filters),
    [filters, query, services],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * CATALOG_PAGE_SIZE;
    return filtered.slice(start, start + CATALOG_PAGE_SIZE);
  }, [filtered, safePage]);

  const filterIsActive = catalogFiltersAreActive(filters);
  const activeFilterChips = useMemo(() => getActiveCatalogFilterChips(filters), [filters]);

  useEffect(() => {
    setPage(0);
  }, [query, filters]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const patchFilters = (patch: Partial<CatalogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const statsById = useMemo(() => new Map(serviceStats.map((s) => [s.serviceId, s])), [serviceStats]);

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
      <div className="space-y-3">
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Услуги
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Создайте услуги, которые клиенты смогут выбрать при записи.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAdd}
            disabled={!masterWrite.canMutate}
            title={masterWrite.mutateDisabledTitle}
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center rounded-[12px] bg-[#F47C8C] px-3 text-[12px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-45 sm:px-4 sm:text-[13px]"
          >
            Добавить услугу
          </button>
          <MasterPublicPreviewLink
            masterId={masterId}
            ready={hasAnySlots}
            variant="secondary"
            className="min-w-0 w-full px-2.5 text-[11px] sm:px-4 sm:text-[13px]"
          />
          {services.length > 0 && !hasAnySlots ? (
            <Link
              to={`${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month`}
              className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#FFF1F4] px-4 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
            >
              Добавить окна для услуг
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <label className="relative min-w-0 flex-1">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
            className={servicesCatalogSearchInput}
          />
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`${servicesCatalogFilterBtn} active:scale-[0.96] ${
            filterIsActive ? servicesCatalogFilterBtnActive : ''
          }`}
          aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры каталога'}
          aria-expanded={filterOpen}
        >
          <HiFunnel className="h-5 w-5" aria-hidden />
          {filterIsActive ? (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F47C8C]"
              aria-hidden
            />
          ) : null}
        </button>
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
          <ul className="flex w-full max-w-none flex-col gap-2.5 lg:gap-3">
            {pageItems.map((service) => {
              const stats = statsById.get(service.id);
              return (
              <CatalogServiceCard
                key={service.id}
                service={service}
                imageSrc={serviceCatalogThumbnailUrl(service, draft)}
                categoryLabel={categoryLabel}
                availableSlotsCount={stats?.availableSlotsCount}
                upcomingAppointmentsCount={stats?.upcomingAppointmentsCount}
                onOpenMenu={onOpenMenu}
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
