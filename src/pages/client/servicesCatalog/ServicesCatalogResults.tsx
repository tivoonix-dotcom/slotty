import type { ReactNode } from 'react';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import { ServiceCard } from '../components/ServiceCard';
import { SectionHeading } from '../components/SectionHeading';
import type { CatalogFiltersState } from './catalogFiltersState';
import { CatalogResultsHeader } from './CatalogResultsHeader';
import { CatalogTrustBar } from './CatalogTrustBar';
import { SkeletonServiceCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { catalogDesktopPanel, catalogInnerDivider } from './servicesCatalogTheme';
import {
  desktopCardLayout,
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
  popular: AggregatedServiceCard[];
  promoServices: AggregatedServiceCard[];
  search: string;
  onClearSearch: () => void;
  filters?: CatalogFiltersState;
  onFiltersChange?: (next: CatalogFiltersState) => void;
};

function ServiceList({
  items,
  layout,
}: {
  items: AggregatedServiceCard[];
  layout: 'mobile' | 'desktop';
}) {
  const isDesktop = layout === 'desktop';

  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <ServiceCard
          key={s.id}
          service={s}
          layout={isDesktop ? desktopCardLayout() : 'stack'}
          surface="card"
        />
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
    <section className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-[#EBEBEB]" />
        <div className="h-4 w-28 animate-pulse rounded bg-[#EBEBEB]" />
      </div>
      <div className="flex flex-col gap-3">
        <SkeletonServiceCard />
        <SkeletonServiceCard />
        <SkeletonServiceCard />
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
  popular,
  promoServices,
  search,
  onClearSearch,
  filters,
  onFiltersChange,
}: Props) {
  if (loading) {
    if (layout === 'desktop') {
      return <DesktopLoadingResults />;
    }

    return (
      <section className={catalogDesktopPanel}>
        <div className={`px-5 py-4 ${catalogInnerDivider}`}>
          <div className="h-6 w-40 animate-pulse rounded bg-[#EBEBEB]" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <SkeletonServiceCard />
          <SkeletonServiceCard />
          <SkeletonServiceCard />
        </div>
      </section>
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
        <EmptyState title="Пока нет доступных услуг" description="Загляните позже" variant="catalog" />
      </CatalogEmptyPanel>
    );
  }

  if (filteredEmpty) {
    return (
      <CatalogEmptyPanel>
        <EmptyState
          title="Такой услуги пока нет"
          description="Попробуйте другой запрос или снимите фильтры"
          actionLabel={search.trim() ? 'Очистить поиск' : undefined}
          onAction={search.trim() ? onClearSearch : undefined}
          variant="catalog"
        />
      </CatalogEmptyPanel>
    );
  }

  const unifiedDesktop = shouldUseUnifiedCatalogSections(layout, filtered.length);
  const sectionGap = 'flex flex-col gap-4';

  if (unifiedDesktop) {
    return (
      <section className="flex flex-col gap-4">
        {filters && onFiltersChange ? (
          <CatalogResultsHeader
            count={filtered.length}
            sortBy={filters.sortBy}
            onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
          />
        ) : null}
        <ServiceList items={filtered} layout="desktop" />
        <CatalogTrustBar />
      </section>
    );
  }

  return (
    <div className={sectionGap}>
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
            ? `${filtered.length} направлений в каталоге`
            : `${filtered.length} вариантов`
        }
        layout={layout}
      >
        <ServiceList items={filtered} layout={layout} />
      </CatalogResultsSection>
    </div>
  );
}
