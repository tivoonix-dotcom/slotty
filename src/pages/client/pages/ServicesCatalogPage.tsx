import { useMemo, useState } from 'react';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import { ClientPageShell } from '../components/ClientPageShell';
import { ClientSearchBar } from '../components/ClientSearchBar';
import { QuickChips } from '../components/QuickChips';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import { ServiceCard } from '../components/ServiceCard';
import { SectionHeading } from '../components/SectionHeading';
import { SkeletonServiceCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { aggregateServicesByCategory } from '../lib/aggregateServices';
import { filterServicesForCatalog, type ServiceCatalogChip } from '../lib/filterServices';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';

const LIGHT_CHIPS: { id: ServiceCatalogChip; label: string }[] = [
  { id: 'popular', label: 'Популярные' },
  { id: 'promo', label: 'С акциями' },
  { id: 'today', label: 'Есть сегодня' },
];

function ServiceList({ items }: { items: AggregatedServiceCard[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      {items.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  );
}

export function ServicesCatalogPage() {
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<string>>(() => new Set());

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = { limit: 80, sortBy: 'recommended' };
    if (search.trim()) p.search = search.trim();
    const chipSet = chips as Set<ServiceCatalogChip>;
    if (chipSet.has('today')) p.dateRange = 'today';
    if (chipSet.has('promo')) p.promotionOnly = true;
    return p;
  }, [search, chips]);

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Услуги');

  const services = useMemo(
    () => aggregateServicesByCategory(listings, categories),
    [listings, categories],
  );

  const chipSet = chips as Set<ServiceCatalogChip>;
  const filtered = useMemo(
    () => filterServicesForCatalog(services, { search, chips: chipSet }),
    [services, search, chips],
  );

  const popular = useMemo(
    () =>
      filtered.filter((s) => s.badge === 'popular' || s.badge === 'hit').slice(0, 6),
    [filtered],
  );

  const promoServices = useMemo(
    () => filtered.filter((s) => s.badge === 'sale' || s.promotionOnly).slice(0, 4),
    [filtered],
  );

  const showSections = chipSet.size === 0 && !search.trim();

  const toggleChip = (id: string) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ClientPageShell>
      <div className="space-y-5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">Услуги</h1>
          <p className="mt-1 text-[15px] text-[#6B7280]">Что вы хотите сделать?</p>
        </div>

        <ClientSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Найти услугу"
          showFilter={false}
        />

        {LIGHT_CHIPS.length > 0 ? (
          <QuickChips chips={LIGHT_CHIPS} activeIds={chips} onToggle={toggleChip} />
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <SkeletonServiceCard />
            <SkeletonServiceCard />
            <SkeletonServiceCard />
          </div>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : services.length === 0 ? (
          <EmptyState title="Пока нет доступных услуг" description="Загляните позже" />
        ) : filtered.length === 0 ? (
          <EmptyState title="Такой услуги пока нет" description="Попробуйте другой запрос" />
        ) : (
          <>
            <section>
              <SectionHeading title="Категории" />
              <ServiceCategoryRail categories={categories} showAllLink />
            </section>

            {showSections && popular.length > 0 ? (
              <section>
                <SectionHeading title="Популярные услуги" />
                <ServiceList items={popular} />
              </section>
            ) : null}

            {showSections && promoServices.length > 0 ? (
              <section>
                <SectionHeading title="С акциями" />
                <ServiceList items={promoServices} />
              </section>
            ) : null}

            <section>
              <SectionHeading
                title={showSections ? 'Все услуги' : 'Найдено'}
                subtitle={showSections ? undefined : `${filtered.length} вариантов`}
              />
              <ServiceList items={showSections ? filtered : filtered} />
            </section>
          </>
        )}
      </div>
    </ClientPageShell>
  );
}
