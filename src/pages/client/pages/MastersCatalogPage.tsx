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
import { FilterSheet, FilterChipGroup } from '../components/FilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { SectionHeading } from '../components/SectionHeading';
import { useCatalogData } from '../hooks/useCatalogData';
import { groupListingsByMaster } from '../lib/groupMasters';
import { buildMasterFeed } from '../lib/partitionMasters';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';

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
  const [chips, setChips] = useState<Set<string>>(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState<string | null>(null);
  const [visitFilter, setVisitFilter] = useState<string | null>(null);

  const flatMode = search.trim().length > 0 || chips.size > 0 || minRating != null || visitFilter != null;

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = { limit: 80 };
    if (search.trim()) p.search = search.trim();
    if (chips.has('today')) p.dateRange = 'today';
    if (chips.has('top') || minRating === '48') p.sortBy = 'rating';
    else if (chips.has('near') && hasGeo) p.sortBy = 'soonest';
    else p.sortBy = 'recommended';
    if (chips.has('home') || visitFilter === 'home') p.visitType = 'at_home';
    if (chips.has('studio') || visitFilter === 'studio') p.visitType = 'studio';
    if (minRating === '45') p.minRating = 4.5;
    if (minRating === '48') p.minRating = 4.8;
    return p;
  }, [search, chips, minRating, visitFilter, hasGeo]);

  const { listings, loading, error, reload } = useCatalogData(apiParams);

  const masters = useMemo(() => groupListingsByMaster(listings), [listings]);

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
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (id === 'near' && !hasGeo) void requestGeo();
      return next;
    });
  };

  return (
    <ClientPageShell>
      <div className="space-y-6 pb-6">
        <MastersCatalogHero
          total={feed.total}
          freeTodayCount={feed.freeTodayCount}
          hasGeo={hasGeo}
        />

        <ClientSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Найти мастера или услугу"
          onFilterClick={() => setFilterOpen(true)}
        />

        <QuickChips chips={[...QUICK_CHIPS]} activeIds={chips} onToggle={toggleChip} />

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

      <FilterSheet
        open={filterOpen}
        title="Фильтры мастеров"
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setMinRating(null);
          setVisitFilter(null);
        }}
        onApply={() => {
          setFilterOpen(false);
          void reload();
        }}
      >
        <FilterChipGroup
          label="Рейтинг"
          options={[
            { id: '45', label: 'от 4.5' },
            { id: '48', label: 'от 4.8' },
          ]}
          value={minRating}
          onChange={setMinRating}
        />
        <FilterChipGroup
          label="Формат"
          options={[
            { id: 'studio', label: 'В студии' },
            { id: 'home', label: 'На дому' },
          ]}
          value={visitFilter}
          onChange={setVisitFilter}
        />
      </FilterSheet>
    </ClientPageShell>
  );
}
