import { HiCheckBadge, HiMapPin, HiHomeModern, HiStar } from 'react-icons/hi2';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { formatDistanceKm, haversineKm } from '../lib/catalogFormat';
import type { ExtendedMasterProfile } from './types';
import { formatMasterRoleLabel, locationDistrictLine, visitChipLabel } from './masterProfileUtils';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name[0] ?? 'M').toUpperCase();
}

export function MasterHeroCard({ master, userLat, userLng }: Props) {
  const lat = master.location.lat;
  const lng = master.location.lng;
  const distanceKm =
    userLat != null && userLng != null && lat != null && lng != null
      ? haversineKm(userLat, userLng, lat, lng)
      : null;
  const distanceLabel = formatDistanceKm(distanceKm);
  const district = locationDistrictLine(master.location.city, master.location.street);
  const showVerified = master.rating >= 4.5 && master.reviewsCount >= 10;

  return (
    <section className="flex gap-4">
      <div className="relative shrink-0">
        <div className="h-[7.5rem] w-[7.5rem] overflow-hidden rounded-[24px] bg-[#FFF1F4] shadow-[0_10px_28px_rgba(244,124,140,0.12)]">
          {master.photoUrl ? (
            <ImageReveal
              src={optimizeAvatarUrl(master.photoUrl, 400)}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[28px] font-bold text-[#F47C8C]">
              {initials(master.masterName)}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start gap-1.5">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#111827]">
            {master.masterName}
          </h1>
          {showVerified ? (
            <HiCheckBadge className="mt-1 h-5 w-5 shrink-0 text-[#F47C8C]" aria-label="Проверенный мастер" />
          ) : null}
        </div>
        <p className="mt-0.5 text-[14px] font-medium text-[#6B7280]">{formatMasterRoleLabel(master.category)}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="flex items-center justify-center gap-0.5 text-[15px] font-semibold text-[#111827]">
              <HiStar className="h-4 w-4 text-[#F47C8C]" aria-hidden />
              {master.rating > 0 ? master.rating.toFixed(1) : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{formatReviewsCountLabel(master.reviewsCount)}</p>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#111827]">
              {master.reviewsCount > 0 ? Math.max(master.reviewsCount, 1) : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">записей</p>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#111827]">{distanceLabel ?? '—'}</p>
            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
              {distanceLabel ? 'от вас' : 'район'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <HiMapPin className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />
            {district}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <HiHomeModern className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />
            {visitChipLabel(master.location.visitType)}
          </span>
        </div>
      </div>
    </section>
  );
}
