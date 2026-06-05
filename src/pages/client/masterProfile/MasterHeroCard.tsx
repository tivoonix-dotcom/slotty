import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import type { ReactNode } from 'react';
import { HiCalendarDays, HiClock, HiHomeModern, HiMapPin, HiStar } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';
import { MasterVerifiedBadge } from '../../../shared/ui/MasterVerifiedBadge';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import { MasterCardPortrait } from '../components/MasterCardPortrait';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { EMPTY_DISTANCE, EMPTY_METRIC } from '../../../shared/lib/emptyDisplayText';
import {
  estimatedBookingsCount,
  formatDistanceKm,
  formatMasterCardSpecialty,
  haversineKm,
  masterDistanceCoords,
} from '../lib/catalogFormat';
import { clientPinkBtn } from '../clientTheme';
import { catalogDesktopPanel } from './masterProfileTheme';
import type { ExtendedMasterProfile } from './types';
import type { NearestSlotInfo } from './types';
import { visitChipLabel } from './masterProfileUtils';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  onChooseTime?: () => void;
};

function formatProfileLocationChip(location: MasterLocation): string {
  const city = location.city?.trim() || 'Минск';
  const district = location.district?.trim();
  if (district && district !== LOCATION_EMPTY_SENTINEL) {
    const short = district.length > 24 ? `${district.slice(0, 23)}…` : district;
    return `${city}, ${short}`;
  }
  const landmark = location.landmark?.trim();
  if (landmark) {
    if (/центр/i.test(landmark)) return `${city}, Центр`;
    const m = landmark.match(/район\s+([^,.]+)/i);
    if (m?.[1]) {
      const part = m[1].trim();
      return `${city}, ${part.length > 18 ? `${part.slice(0, 17)}…` : part}`;
    }
  }
  const street = location.street?.trim();
  if (street && street !== LOCATION_EMPTY_SENTINEL) {
    const cleaned = street
      .replace(/^ул\.?\s*/i, '')
      .replace(/^улица\s*/i, '')
      .replace(/^пр-т\s*/i, '');
    const withBuilding = location.building?.trim() && location.building !== 'б/н'
      ? `${cleaned}, ${location.building.trim()}`
      : cleaned;
    const short = withBuilding.length > 28 ? `${withBuilding.slice(0, 27)}…` : withBuilding;
    return `${city}, ${short}`;
  }
  return city;
}

function StatCell({
  value,
  label,
  valueClassName = 'text-[17px] font-bold text-[#111827]',
}: {
  value: ReactNode;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className={`flex min-h-[1.35rem] items-center justify-center leading-tight ${valueClassName}`}>
        {value}
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-[#9CA3AF]">{label}</p>
    </div>
  );
}

function StatDivider() {
  return <div className="mx-1 w-px self-stretch bg-[#F3F4F6]" aria-hidden />;
}

export function MasterHeroCard({
  master,
  userLat,
  userLng,
  nearest,
  nearestLoading,
  onChooseTime,
}: Props) {
  const { lat, lng } = masterDistanceCoords(master.location);
  const distanceKm =
    userLat != null && userLng != null && lat != null && lng != null
      ? haversineKm(userLat, userLng, lat, lng)
      : null;
  const distanceLabel = formatDistanceKm(distanceKm);
  const locationChip = formatProfileLocationChip(master.location);
  const visitChip = visitChipLabel(master.location.visitType);
  const showVerified = masterShowsVerifiedBadge(master);
  const isNewMaster = master.reviewsCount <= 0 && master.rating <= 0;
  const bookingsCount = estimatedBookingsCount(master.reviewsCount);
  const hasSlot = Boolean(nearest?.label);

  return (
    <section className={`overflow-hidden ${catalogDesktopPanel}`}>
      <div className="flex gap-4 p-4 sm:gap-5">
        <MasterCardPortrait
          masterName={master.masterName}
          photoUrl={master.photoUrl}
          className="relative h-[8.5rem] w-[7rem] shrink-0"
          imageClassName="h-full w-full rounded-[16px] object-cover"
          loading="eager"
          badge={
            hasSlot ? (
              <span className="absolute bottom-2 left-1.5 right-1.5 flex items-center justify-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#15803D] shadow-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
                Свободна
              </span>
            ) : undefined
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <h1 className="line-clamp-2 text-[20px] font-semibold leading-snug tracking-tight text-[#111827]">
              {master.masterName}
            </h1>
            {showVerified ? (
              <MasterVerifiedBadge className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" />
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-[#6B7280]">
            {formatMasterCardSpecialty(master.category)}
          </p>

          <div className="mt-4 flex items-start border-t border-[#F3F4F6] pt-3">
            {isNewMaster ? (
              <StatCell
                value="Новый"
                label="мастер"
                valueClassName="text-[15px] font-bold text-[#F47C8C]"
              />
            ) : (
              <StatCell
                value={
                  <span className="inline-flex items-center justify-center gap-0.5">
                    <HiStar className="h-4 w-4 text-amber-400" aria-hidden />
                    {master.rating > 0 ? master.rating.toFixed(1) : EMPTY_METRIC}
                  </span>
                }
                label={
                  master.reviewsCount > 0
                    ? formatReviewsCountLabel(master.reviewsCount)
                    : 'нет отзывов'
                }
              />
            )}
            <StatDivider />
            {bookingsCount != null ? (
              <StatCell value={String(bookingsCount)} label="записей" />
            ) : (
              <StatCell value={EMPTY_METRIC} label="записей" valueClassName="text-[15px] font-bold text-[#9CA3AF]" />
            )}
            <StatDivider />
            <StatCell
              value={distanceLabel ?? EMPTY_DISTANCE}
              label={distanceLabel ? 'от вас' : 'расстояние'}
              valueClassName={
                distanceLabel
                  ? 'text-[17px] font-bold text-[#111827]'
                  : 'text-[17px] font-bold text-[#D1D5DB]'
              }
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span className="truncate">{locationChip}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              <HiHomeModern className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              {visitChip}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 border-t border-[#EEEEEE] px-4 py-3 ${
          hasSlot ? 'bg-[#FFF1F4]' : 'bg-[#FAFAFA]'
        }`}
      >
        <HiClock
          className={`h-5 w-5 shrink-0 ${hasSlot || nearestLoading ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`}
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-[14px] font-semibold text-[#111827]">
          {nearestLoading
            ? 'Ищем ближайшее окно…'
            : hasSlot
              ? `Ближайшее окно: ${nearest!.label.toLowerCase()}`
              : 'Свободных окон пока нет'}
        </p>
        {onChooseTime ? (
          <button
            type="button"
            onClick={onChooseTime}
            className={`${clientPinkBtn} shrink-0 !min-h-10 gap-1.5 !px-4 !text-[13px]`}
          >
            <HiCalendarDays className="h-4 w-4" aria-hidden />
            {hasSlot ? 'Выбрать время' : 'Услуги'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
