import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { MasterCard } from './MasterCard';
import { SectionHeading } from './SectionHeading';

type Props = {
  title: string;
  subtitle?: string;
  items: ServiceListingRecord[];
  userLat: number | null;
  userLng: number | null;
};

export function MasterSectionRail({ title, subtitle, items, userLat, userLng }: Props) {
  if (!items.length) return null;

  return (
    <section className="-mx-4 sm:-mx-5">
      <div className="px-4 sm:px-5">
        <SectionHeading title={title} subtitle={subtitle} />
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 py-1.5 pb-1 snap-x snap-mandatory [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
        {items.map((listing) => (
          <div key={listing.masterId} className="w-[min(82vw,300px)] shrink-0 snap-start">
            <MasterCard
              listing={listing}
              userLat={userLat}
              userLng={userLng}
              layout="carousel"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
