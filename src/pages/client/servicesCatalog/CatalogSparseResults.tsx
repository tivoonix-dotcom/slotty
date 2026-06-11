import { useMemo } from 'react';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import { ServiceCard } from '../components/ServiceCard';
import { SectionHeading } from '../components/SectionHeading';
import { catalogDesktopPanel } from './servicesCatalogTheme';
import { desktopGridClassName } from './servicesCatalogLayout';

type Props = {
  filtered: AggregatedServiceCard[];
  catalogServices: AggregatedServiceCard[];
  layout: 'mobile' | 'desktop';
};

function buildSparseSuggestions(
  filtered: AggregatedServiceCard[],
  catalogServices: AggregatedServiceCard[],
): AggregatedServiceCard[] {
  const filteredIds = new Set(filtered.map((s) => s.id));
  return [...catalogServices]
    .filter((s) => !filteredIds.has(s.id))
    .sort((a, b) => {
      if (a.hasToday !== b.hasToday) return a.hasToday ? -1 : 1;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.totalReviews - a.totalReviews;
    })
    .slice(0, 4);
}

/** Когда в выдаче мало услуг — не оставляем страницу пустой. */
export function CatalogSparseResults({ filtered, catalogServices, layout }: Props) {
  const items = useMemo(
    () => buildSparseSuggestions(filtered, catalogServices),
    [filtered, catalogServices],
  );

  if (filtered.length > 2 || items.length === 0) return null;

  const isDesktop = layout === 'desktop';

  return (
    <section className={`${isDesktop ? '' : catalogDesktopPanel} mt-2`}>
      <div className={isDesktop ? 'mb-3' : 'border-b border-[#EEEEEE] px-4 py-3'}>
        <SectionHeading
          title="Ещё варианты рядом"
          subtitle="Другие услуги и мастера с ближайшими окнами"
          className="!mb-0"
        />
      </div>
      <div className={isDesktop ? desktopGridClassName() : 'flex flex-col gap-3 p-3 pt-0'}>
        {items.map((s) => (
          <ServiceCard key={s.id} service={s} layout="grid" surface="card" density={isDesktop ? 'comfortable' : 'compact'} />
        ))}
      </div>
    </section>
  );
}
