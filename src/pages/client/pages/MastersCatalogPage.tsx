import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { ClientSearchBar } from '../components/ClientSearchBar';
import { QuickChips } from '../components/QuickChips';
import { MasterCard } from '../components/MasterCard';
import { MasterSectionRail } from '../components/MasterSectionRail';
import { TopMastersSection } from '../components/TopMastersSection';
import { MastersCatalogHero } from '../components/MastersCatalogHero';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { CategoryMasterFilterSheet } from '../components/CategoryMasterFilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { SectionHeading } from '../components/SectionHeading';
import { useCatalogData } from '../hooks/useCatalogData';
import { groupListingsByMaster } from '../lib/groupMasters';
import { buildMasterFeed } from '../lib/partitionMasters';
import {
  categoryFiltersToApiParams,
  countActiveCategoryFilters,
  DEFAULT_CATEGORY_MASTER_FILTERS,
  filtersToMastersQuickChips,
  hasActiveCatalogFilters,
  toggleMastersQuickChip,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';

const QUICK_CHIPS = [
  { id: 'near', label: 'Рядом' },
  { id: 'today', label: 'Сегодня' },
  { id: 'top', label: 'Топ рейтинг' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
] as const;

export function MastersCatalogPage() {
  const { hasGeo, requestGeo, userLat, userLng } = useOutletContext<ClientOutletContext>();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterDraft, setFilterDraft] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCategoryFilters(filters);
  const quickChipIds = useMemo(() => filtersToMastersQuickChips(filters), [filters]);

  const flatMode =
    search.trim().length > 0 || hasActiveCatalogFilters(filters);

  const apiParams = useMemo(
    () => categoryFiltersToApiParams(filters, { limit: 80, search: search.trim() || undefined }, hasGeo),
    [filters, search, hasGeo],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);

  const masters = useMemo(() => {
    let list = groupListingsByMaster(listings);
    if (filters.onlyWithSlots) {
      list = list.filter((m) => Boolean(m.nextSlotStartsAt));
    }
    return list;
  }, [listings, filters.onlyWithSlots]);

  const feed = useMemo(
    () =>
      buildMasterFeed(masters, {
        hasGeo,
        userLat,
        userLng,
        flatMode,
      }),
    [masters, hasGeo, userLat, userLng, flatMode],
  );

  const toggleChip = (id: string) => {
    const turningOnNear = id === 'near' && !quickChipIds.has('near');
    setFilters((prev) => toggleMastersQuickChip(prev, id));
    if (turningOnNear && !hasGeo) void requestGeo();
  };

  const openFilters = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ code: c.code, name: c.name })),
    [categories],
  );

  return (
    <ClientPageShell>
      <div className="space-y-6 pb-6">
        <MastersCatalogHero total={feed.total} freeTodayCount={feed.freeTodayCount} />

        <ClientSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Найти мастера или услугу"
          onFilterClick={openFilters}
          activeFilterCount={activeFilterCount}
        />

        <QuickChips chips={[...QUICK_CHIPS]} activeIds={quickChipIds} onToggle={toggleChip} />

        {quickChipIds.has('near') && !hasGeo ? (
          <GeoPromptCard onAllow={requestGeo} />
        ) : null}
        {!hasGeo && !flatMode ? <GeoPromptCard onAllow={requestGeo} /> : null}

        {loading ? (
          <div className="space-y-3">
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </div>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : feed.total === 0 ? (
          <EmptyState
            title="Мастеров пока нет"
            description="Попробуйте изменить фильтры или зайдите позже"
            actionLabel="Сбросить фильтры"
            onAction={() => setFilters({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
          />
        ) : feed.singleMaster ? (
          <MasterCard
            listing={feed.singleMaster}
            userLat={userLat}
            userLng={userLng}
            layout="featured"
          />
        ) : (
          <div className="space-y-8">
            {feed.sections.map((section) => {
              if (section.id === 'top') {
                return (
                  <TopMastersSection
                    key={section.id}
                    items={section.items}
                    userLat={userLat}
                    userLng={userLng}
                  />
                );
              }

              if (section.layout === 'carousel') {
                return (
                  <MasterSectionRail
                    key={section.id}
                    title={section.title}
                    subtitle={section.subtitle}
                    items={section.items}
                    userLat={userLat}
                    userLng={userLng}
                  />
                );
              }

              return (
                <section key={section.id}>
                  <SectionHeading title={section.title} subtitle={section.subtitle} />
                  <div className="space-y-2.5">
                    {section.items.map((m) => (
                      <MasterCard
                        key={m.masterId}
                        listing={m}
                        userLat={userLat}
                        userLng={userLng}
                        layout="list"
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <CategoryMasterFilterSheet
        open={filterOpen}
        title="Фильтры мастеров"
        draft={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        serviceCategories={categoryOptions}
        onApply={() => {
          setFilters(filterDraft);
          setFilterOpen(false);
          void reload();
        }}
      />
    </ClientPageShell>
  );
}
