import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiFunnel, HiMagnifyingGlass } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
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
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesCatalogViewToggle, type CatalogViewMode } from './ServicesCatalogViewToggle';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle, ServiceBundleStatus } from './servicesTypes';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  bundles: ServiceBundle[];
  loading?: boolean;
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onCreate: () => void;
  onMenu: (bundle: ServiceBundle) => void;
};

type BundleSort = 'default' | 'price_asc' | 'price_desc' | 'title';
type BundleVisibilityFilter = 'all' | ServiceBundleStatus;

const BUNDLE_PAGE_SIZE = 10;

const SORT_OPTIONS: Array<{ value: BundleSort; label: string }> = [
  { value: 'default', label: 'Сортировка: По умолчанию' },
  { value: 'price_asc', label: 'Сортировка: Дешевле' },
  { value: 'price_desc', label: 'Сортировка: Дороже' },
  { value: 'title', label: 'Сортировка: По названию' },
];

const VISIBILITY_OPTIONS: Array<{ id: BundleVisibilityFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'visible', label: 'Видимые' },
  { id: 'hidden', label: 'Скрытые' },
  { id: 'draft', label: 'Черновики' },
];

function pluralBundles(count: number): string {
  if (count === 1) return '1 набор в каталоге';
  if (count < 5) return `${count} набора в каталоге`;
  return `${count} наборов в каталоге`;
}

function sortBundles(list: ServiceBundle[], sort: BundleSort): ServiceBundle[] {
  const copy = [...list];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.bundlePrice - b.bundlePrice);
    case 'price_desc':
      return copy.sort((a, b) => b.bundlePrice - a.bundlePrice);
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    default:
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

function BundlePagination({
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
  const from = page * BUNDLE_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * BUNDLE_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы наборов"
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

export function ServicesBundlesTab({
  draft,
  services,
  bundles,
  loading = false,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onCreate,
  onMenu,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<BundleSort>('default');
  const [visibility, setVisibility] = useState<BundleVisibilityFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CatalogViewMode>('list');
  const [page, setPage] = useState(0);
  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const serviceTitleById = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((service) => map.set(service.id, service.title));
    return map;
  }, [services]);

  const filterIsActive = visibility !== 'all';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = [...bundles];
    if (visibility !== 'all') {
      rows = rows.filter((bundle) => bundle.status === visibility);
    }
    if (q) {
      rows = rows.filter((bundle) => {
        if (bundle.title.toLowerCase().includes(q)) return true;
        return bundle.serviceIds.some((id) =>
          (serviceTitleById.get(id) ?? '').toLowerCase().includes(q),
        );
      });
    }
    return sortBundles(rows, sort);
  }, [bundles, query, serviceTitleById, sort, visibility]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / BUNDLE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * BUNDLE_PAGE_SIZE;
    return filtered.slice(start, start + BUNDLE_PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [query, sort, visibility]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const openCreate = () => {
    if (extrasLocked) {
      connectPro();
      return;
    }
    onCreate();
  };

  const canCreate = services.length >= 2;

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="bundles"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center py-8">
        <LoadingVideo size="lg" />
      </div>
    );
  }

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
              Наборы
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280] sm:text-[14px]">
              {bundles.length > 0
                ? pluralBundles(bundles.length)
                : 'Комбо из нескольких услуг со скидкой'}
            </p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              disabled={!masterWrite.canMutate}
              title={masterWrite.mutateDisabledTitle}
              className={`${servicesCatalogAddBtnHeader} shrink-0 self-start`}
            >
              Создать набор +
            </button>
          ) : null}
        </div>

        {!canCreate ? (
          <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[13px] font-medium text-[#6B7280]">
            Добавьте минимум 2 услуги в каталоге, чтобы создать набор.
          </p>
        ) : null}

        {bundles.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative min-w-0 flex-1 sm:min-w-[12rem]">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск набора"
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
                aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры наборов'}
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
                  onChange={(value) => setSort(value as BundleSort)}
                  options={SORT_OPTIONS}
                  aria-label="Сортировка"
                  sheetTitle="Сортировка"
                />
              </div>
              <ServicesCatalogViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
        ) : null}

        {bundles.length === 0 ? (
          <div className={`${profileDashboardCard} p-6 text-center`}>
            <MiniPicture name="servicesEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Наборов пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              {canCreate
                ? 'Создайте комбо из нескольких услуг — клиенты увидят скидку при записи.'
                : 'Добавьте минимум 2 услуги в каталоге.'}
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
                onClick={() => setVisibility('all')}
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
              {pageItems.map((bundle) => (
                <ServicesBundleCard
                  key={bundle.id}
                  as="li"
                  layout={viewMode}
                  bundle={bundle}
                  services={services}
                  draft={draft}
                  serviceTitleById={serviceTitleById}
                  onMenu={() => onMenu(bundle)}
                />
              ))}
            </ul>
            {filtered.length > BUNDLE_PAGE_SIZE ? (
              <BundlePagination
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
        title="Фильтры наборов"
        footer={
          <button type="button" className={catalogSheetPrimaryBtn} onClick={() => setFilterOpen(false)}>
            Готово
          </button>
        }
      >
        <section className={catalogFilterSectionClass}>
          <p className={sheetSectionTitleClass}>Видимость</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Видимость набора">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVisibility(option.id)}
                aria-pressed={visibility === option.id}
                className={catalogFilterChipClass(visibility === option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </AdminBottomSheet>
    </div>
  );
}
