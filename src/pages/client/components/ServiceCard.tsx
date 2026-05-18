import { Link } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi2';
import { getServiceCategoryPath } from '../../../app/paths';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import {
  formatDurationMinutes,
  formatMastersCountLabel,
  formatPriceFrom,
  formatServiceAvailabilityLabel,
} from '../lib/catalogFormat';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import { clientCard } from '../clientTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

const BADGE_LABEL: Record<NonNullable<AggregatedServiceCard['badge']>, string> = {
  popular: 'Популярно',
  hit: 'Хит',
  sale: '-10%',
};

type Props = {
  service: AggregatedServiceCard;
};

export function ServiceCard({ service }: Props) {
  const availabilityLabel = formatServiceAvailabilityLabel(
    service.hasToday,
    service.nearestSlotIso,
  );

  return (
    <Link
      to={getServiceCategoryPath(service.categoryCode)}
      className={`${clientCard} flex gap-3 p-3 transition active:scale-[0.99]`}
    >
      <ImageReveal
        src={getCategoryWorkPhotoUrl(service.categoryCode)}
        alt=""
        className="h-[88px] w-[88px] shrink-0 rounded-[20px] object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[17px] font-semibold leading-tight text-[#111827]">{service.title}</p>
          {service.badge ? (
            <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold text-[#F47C8C]">
              {BADGE_LABEL[service.badge]}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          {formatPriceFrom(service.minPrice)} · {formatDurationMinutes(service.durationMinutes)}
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#374151]">
          {formatMastersCountLabel(service.masterCount)}
          {' · '}
          <span className="text-[#F47C8C]">{availabilityLabel}</span>
        </p>
      </div>
      <HiChevronRight className="mt-6 h-5 w-5 shrink-0 text-[#D1D5DB]" aria-hidden />
    </Link>
  );
}
