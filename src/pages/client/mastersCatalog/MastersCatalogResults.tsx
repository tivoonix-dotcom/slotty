import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { MasterCard } from '../components/MasterCard';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { CatalogTrustBar } from '../servicesCatalog/CatalogTrustBar';
import { catalogDesktopPanel } from '../servicesCatalog/servicesCatalogTheme';
import { MastersCatalogResultsHeader } from './MastersCatalogResultsHeader';

type Props = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  masters: ServiceListingRecord[];
  filters: CategoryMasterFilters;
  onFiltersChange: (next: CategoryMasterFilters) => void;
  onResetFilters: () => void;
  userLat: number | null;
  userLng: number | null;
  hasGeo: boolean;
  onRequestGeo: () => void;
  showGeoPrompt: boolean;
};

export function MastersCatalogResults({
  loading,
  error,
  onRetry,
  masters,
  filters,
  onFiltersChange,
  onResetFilters,
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
          title="Мастеров пока нет"
          description="Попробуйте изменить фильтры или зайдите позже"
          actionLabel="Сбросить фильтры"
          onAction={onResetFilters}
          variant="catalog"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {showGeoPrompt && !hasGeo ? <GeoPromptCard onAllow={onRequestGeo} /> : null}

      <MastersCatalogResultsHeader
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
