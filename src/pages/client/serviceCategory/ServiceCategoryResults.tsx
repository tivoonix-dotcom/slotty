import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { MasterCard } from '../components/MasterCard';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { CatalogTrustBar } from '../servicesCatalog/CatalogTrustBar';
import { catalogDesktopPanel } from '../servicesCatalog/servicesCatalogTheme';
import { ServiceCategoryResultsHeader } from './ServiceCategoryResultsHeader';

type Props = {
  categoryName: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  masters: ServiceListingRecord[];
  filters: CategoryMasterFilters;
  onFiltersChange: (next: CategoryMasterFilters) => void;
  onResetFilters: () => void;
  onShowTomorrow: () => void;
  todayFilterNoSlots: boolean;
  userLat: number | null;
  userLng: number | null;
  hasGeo: boolean;
  onRequestGeo: () => void;
  showGeoPrompt: boolean;
};

export function ServiceCategoryResults({
  categoryName,
  loading,
  error,
  onRetry,
  masters,
  filters,
  onFiltersChange,
  onResetFilters,
  onShowTomorrow,
  todayFilterNoSlots,
  userLat,
  userLng,
  hasGeo,
  onRequestGeo,
  showGeoPrompt,
}: Props) {
  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[#EBEBEB]" />
        </div>
        <div className="flex flex-col gap-3">
          <SkeletonMasterCard />
          <SkeletonMasterCard />
          <SkeletonMasterCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${catalogDesktopPanel} p-8`}>
        <CatalogError message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (masters.length === 0) {
    return (
      <section className={`${catalogDesktopPanel} p-8`}>
        <EmptyState
          title="Пока нет мастеров по этой услуге"
          description="Попробуйте снять фильтры или выберите другую услугу"
          actionLabel="Сбросить фильтры"
          onAction={onResetFilters}
          variant="catalog"
        />
      </section>
    );
  }

  if (todayFilterNoSlots) {
    return (
      <section className={`${catalogDesktopPanel} p-8`}>
        <EmptyState
          title="Свободных окон на сегодня нет"
          description="Попробуйте выбрать другую дату"
          actionLabel="Смотреть завтра"
          onAction={onShowTomorrow}
          variant="catalog"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {showGeoPrompt && !hasGeo ? <GeoPromptCard onAllow={onRequestGeo} /> : null}

      <ServiceCategoryResultsHeader
        categoryName={categoryName}
        count={masters.length}
        sortBy={filters.sortBy}
        onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
      />

      <div className="flex flex-col gap-3">
        {masters.map((m) => (
          <MasterCard
            key={m.masterId}
            listing={m}
            userLat={userLat}
            userLng={userLng}
            layout="catalog"
          />
        ))}
      </div>

      <CatalogTrustBar />
    </section>
  );
}
