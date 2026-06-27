import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getServicesCatalogPath } from '../../../app/paths';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import { ServiceCard } from '../components/ServiceCard';
import { SectionHeading } from '../components/SectionHeading';
import type { CatalogFiltersState } from './catalogFiltersState';
import { CatalogResultsHeader } from './CatalogResultsHeader';
import { CatalogSparseResults } from './CatalogSparseResults';
import { CatalogTrustBar } from './CatalogTrustBar';
import { SkeletonServiceCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { catalogDesktopPanel, catalogInnerDivider } from './servicesCatalogTheme';
import {
  desktopCardLayout,
  desktopGridClassName,
  mobileCardLayout,
  mobileGridClassName,
  shouldUseUnifiedCatalogSections,
} from './servicesCatalogLayout';

type Props = {
  layout: 'mobile' | 'desktop';
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  servicesEmpty: boolean;
  filteredEmpty: boolean;
  showSections: boolean;
  filtered: AggregatedServiceCard[];
  catalogServices: AggregatedServiceCard[];
  popular: AggregatedServiceCard[];
  promoServices: AggregatedServiceCard[];
  search: string;
  onClearSearch: () => void;
  onResetFilters?: () => void;
  onOpenFilters?: () => void;
  filters?: CatalogFiltersState;
  onFiltersChange?: (next: CatalogFiltersState) => void;
  /** Заголовок результатов вынесен в шапку каталога (десктоп) */
  hideResultsHeader?: boolean;
};

function ServiceList({
  items,
  layout,
}: {
  items: AggregatedServiceCard[];
  layout: 'mobile' | 'desktop';
}) {
  const isDesktop = layout === 'desktop';
  const gridClass = isDesktop ? desktopGridClassName() : mobileGridClassName();

  return (
    <div className={gridClass}>
      {items.map((s) => (
        <div key={s.id} className="flex h-full min-w-0">
          <ServiceCard
            service={s}
            layout={isDesktop ? desktopCardLayout() : mobileCardLayout()}
            surface="card"
            density={isDesktop ? 'comfortable' : 'compact'}
          />
        </div>
      ))}
    </div>
  );
}

/** Заголовок отдельно от карточек на десктопе; на мобиле — в одной панели */
function CatalogResultsSection({
  title,
  subtitle,
  layout,
  children,
}: {
  title: string;
  subtitle?: string;
  layout: 'mobile' | 'desktop';
  children: ReactNode;
}) {
  if (layout === 'desktop') {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeading title={title} subtitle={subtitle} className="!mb-0" />
        {children}
      </section>
    );
  }

  return (
    <section className={catalogDesktopPanel}>
      <div className={`px-5 py-4 ${catalogInnerDivider}`}>
        <SectionHeading title={title} subtitle={subtitle} className="!mb-0" />
      </div>
      <div className="px-4 pb-4 pt-0">{children}</div>
    </section>
  );
}

function CatalogEmptyPanel({ children }: { children: ReactNode }) {
  return <section className={`${catalogDesktopPanel} p-8`}>{children}</section>;
}

function DesktopLoadingResults() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-6 w-20 animate-pulse rounded bg-[#EBEBEB]/80" />
        </div>
        <div className="h-8 w-36 animate-pulse rounded-[10px] bg-[#EBEBEB]" />
      </div>
      <div className={desktopGridClassName()}>
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
      </div>
    </section>
  );
}

export function ServicesCatalogResults({
  layout,
  loading,
  error,
  onRetry,
  servicesEmpty,
  filteredEmpty,
  showSections,
  filtered,
  catalogServices,
  popular,
  promoServices,
  search,
  onClearSearch,
  onResetFilters,
  onOpenFilters,
  filters,
  onFiltersChange,
  hideResultsHeader = false,
}: Props) {
  if (loading) {
    if (layout === 'desktop') {
      return <DesktopLoadingResults />;
    }

    return (
      <div className={mobileGridClassName()}>
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
        <SkeletonServiceCard variant="grid" />
      </div>
    );
  }

  if (error) {
    return (
      <CatalogEmptyPanel>
        <CatalogError message={error} onRetry={onRetry} />
      </CatalogEmptyPanel>
    );
  }

  if (servicesEmpty) {
    return (
      <CatalogEmptyPanel>
        <EmptyState
          title="Пока нет доступных услуг"
          description="Мастера скоро добавят услуги — загляните позже или вернитесь на главную"
          variant="catalog"
          picture="servicesEmpty"
        />
      </CatalogEmptyPanel>
    );
  }

  if (filteredEmpty) {
    const canReset = Boolean(onResetFilters);
    const canClearSearch = Boolean(search.trim());
    const canOpenFilters = Boolean(onOpenFilters);

    return (
      <CatalogEmptyPanel>
        <EmptyState
          title="Ничего не нашли"
          description="Попробуйте другой запрос или измените фильтры — возможно, услуга есть под другим названием"
          actionLabel={
            canClearSearch
              ? 'Очистить поиск'
              : canOpenFilters
                ? 'Изменить фильтры'
                : canReset
                  ? 'Сбросить фильтры'
                  : undefined
          }
          onAction={
            canClearSearch
              ? onClearSearch
              : canOpenFilters
                ? onOpenFilters
                : canReset
                  ? onResetFilters
                  : undefined
          }
          variant="catalog"
          picture="searchEmpty"
        />
        {canReset && (canClearSearch || canOpenFilters) ? (
          <p className="mt-3 text-center">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[14px] font-semibold text-[#F47C8C] hover:underline"
            >
              Сбросить все фильтры
            </button>
          </p>
        ) : null}
        <p className="mt-4 text-center text-[14px] text-[#6B7280]">
          Или{' '}
          <Link
            to={getServicesCatalogPath({ tab: 'popular' })}
            className="font-semibold text-[#F47C8C] hover:underline"
          >
            посмотреть популярные услуги
          </Link>
        </p>
      </CatalogEmptyPanel>
    );
  }

  const unified = shouldUseUnifiedCatalogSections(layout, filtered.length);

  if (unified && layout === 'desktop') {
    return (
      <section className="flex flex-col gap-2">
        {filters && onFiltersChange && !hideResultsHeader ? (
          <CatalogResultsHeader
            count={filtered.length}
            sortBy={filters.sortBy}
            onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
          />
        ) : null}
        <ServiceList items={filtered} layout="desktop" />
        <CatalogSparseResults
          filtered={filtered}
          catalogServices={catalogServices}
          layout="desktop"
        />
        <CatalogTrustBar />
      </section>
    );
  }

  if (unified && layout === 'mobile') {
    return (
      <div className="flex flex-col gap-3">
        {showSections && popular.length > 0 ? (
          <div className="space-y-2">
            <p className="px-0.5 text-[13px] font-semibold text-[#8E8E93]">Популярное</p>
            <ServiceList items={popular.slice(0, 4)} layout={layout} />
          </div>
        ) : null}
        <div className="space-y-2">
          {!showSections ? (
            <p className="px-0.5 text-[13px] font-semibold text-[#8E8E93]">
              Найдено: {filtered.length}
            </p>
          ) : null}
          <ServiceList items={filtered} layout={layout} />
        </div>
        <CatalogSparseResults
          filtered={filtered}
          catalogServices={catalogServices}
          layout={layout}
        />
        <CatalogTrustBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showSections && popular.length > 0 ? (
        <CatalogResultsSection
          title="Популярные"
          subtitle="Чаще всего выбирают в вашем городе"
          layout={layout}
        >
          <ServiceList items={popular} layout={layout} />
        </CatalogResultsSection>
      ) : null}

      {showSections && promoServices.length > 0 && layout === 'desktop' ? (
        <CatalogResultsSection
          title="С акциями"
          subtitle="Выгодные предложения от мастеров"
          layout={layout}
        >
          <ServiceList items={promoServices} layout={layout} />
        </CatalogResultsSection>
      ) : null}

      <CatalogResultsSection
        title={showSections ? 'Все услуги' : 'Найдено'}
        subtitle={
          showSections
            ? `${filtered.length} услуг в каталоге`
            : `${filtered.length} вариантов`
        }
        layout={layout}
      >
        <ServiceList items={filtered} layout={layout} />
      </CatalogResultsSection>
    </div>
  );
}
