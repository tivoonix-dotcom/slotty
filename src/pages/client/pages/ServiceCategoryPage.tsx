import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { MasterCard } from '../components/MasterCard';
import { QuickChips } from '../components/QuickChips';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { FilterSheet, FilterChipGroup } from '../components/FilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { SERVICES_PATH } from '../../../app/paths';
import { groupListingsByMaster, sortMastersByDistance } from '../lib/groupMasters';
import { formatDurationMinutes, formatMastersCountLabel, formatPriceFrom } from '../lib/catalogFormat';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';

const FILTER_CHIPS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'near', label: 'Рядом' },
  { id: 'rating', label: 'Рейтинг' },
  { id: 'price', label: 'Дешевле' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
  { id: 'promo', label: 'С акциями' },
] as const;

export function ServiceCategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const { userLat, userLng, hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [chips, setChips] = useState<Set<string>>(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [visitFilter, setVisitFilter] = useState<string | null>(null);

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = {
      limit: 80,
      category: categoryCode,
    };
    if (chips.has('today')) p.dateRange = 'today';
    if (chips.has('tomorrow')) p.dateRange = 'tomorrow';
    if (chips.has('promo')) p.promotionOnly = true;
    if (chips.has('rating')) p.sortBy = 'rating';
    else if (chips.has('price')) p.sortBy = 'price_asc';
    else if (chips.has('near') && hasGeo) p.sortBy = 'soonest';
    else p.sortBy = 'recommended';
    if (chips.has('home') || visitFilter === 'home') p.visitType = 'at_home';
    if (chips.has('studio') || visitFilter === 'studio') p.visitType = 'studio';
    return p;
  }, [categoryCode, chips, visitFilter, hasGeo]);

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);

  const categoryName =
    categories.find((c) => c.code === categoryCode)?.name ?? categoryCode ?? 'Услуга';

  const masters = useMemo(() => {
    let list = groupListingsByMaster(listings);
    list = sortMastersByDistance(list, userLat, userLng);
    if (chips.has('rating')) {
      list = [...list].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    }
    if (chips.has('price')) {
      list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    }
    return list;
  }, [listings, userLat, userLng, chips]);

  const stats = useMemo(() => {
    const prices = listings.map((l) => l.priceFrom).filter((p) => p > 0);
    const durations = listings
      .map((l) => {
        const m = l.serviceName.match(/(\d+)\s*мин/);
        return m ? Number(m[1]) : null;
      })
      .filter((d): d is number => d != null);
    return {
      minPrice: prices.length ? Math.min(...prices) : null,
      duration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 90,
      masterCount: masters.length,
    };
  }, [listings, masters.length]);

  const toggleChip = (id: string) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (id === 'near' && !hasGeo) void requestGeo();
      return next;
    });
  };

  const todayFilterNoSlots =
    chips.has('today') && !loading && masters.length > 0 && masters.every((m) => !m.nextSlotStartsAt);

  return (
    <ClientPageShell>
      <Link
        to={SERVICES_PATH}
        className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#6B7280]"
      >
        <HiArrowLeft className="h-4 w-4" aria-hidden />
        Услуги
      </Link>

      <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#111827]">
        {categoryName}
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-[#6B7280]">
        Выберите мастера и удобное время
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-medium text-[#374151]">
        {stats.minPrice != null ? (
          <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">{formatPriceFrom(stats.minPrice)}</span>
        ) : null}
        <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">
          {formatDurationMinutes(stats.duration)}
        </span>
        <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">
          {formatMastersCountLabel(stats.masterCount)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <QuickChips chips={[...FILTER_CHIPS]} activeIds={chips} onToggle={toggleChip} />
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="text-[13px] font-semibold text-[#F47C8C]"
        >
          Ещё фильтры
        </button>
        {chips.has('near') && !hasGeo ? <GeoPromptCard onAllow={requestGeo} /> : null}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : masters.length === 0 ? (
          <EmptyState
            title="Пока нет мастеров по этой услуге"
            description="Попробуйте снять фильтры или выберите другую услугу"
          />
        ) : todayFilterNoSlots ? (
          <EmptyState
            title="Свободных окон на сегодня нет"
            description="Попробуйте выбрать другую дату"
            actionLabel="Смотреть завтра"
            onAction={() => {
              setChips((prev) => {
                const next = new Set(prev);
                next.delete('today');
                next.add('tomorrow');
                return next;
              });
            }}
          />
        ) : (
          masters.map((m) => (
            <MasterCard key={m.masterId} listing={m} userLat={userLat} userLng={userLng} />
          ))
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        title={`Фильтры · ${categoryName}`}
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setVisitFilter(null);
          setChips(new Set());
        }}
        onApply={() => {
          setFilterOpen(false);
          void reload();
        }}
      >
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
