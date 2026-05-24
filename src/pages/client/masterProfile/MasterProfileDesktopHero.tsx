import {
  HiCheckBadge,
  HiClock,
  HiHomeModern,
  HiMapPin,
  HiStar,
} from 'react-icons/hi2';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  estimatedBookingsCount,
  formatDistanceKm,
  formatMasterCardSpecialty,
  haversineKm,
} from '../lib/catalogFormat';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { visitChipLabel } from './masterProfileUtils';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name[0] ?? 'M').toUpperCase();
}

export function MasterProfileDesktopHero({
  master,
  userLat,
  userLng,
  nearest,
  nearestLoading,
}: Props) {
  const lat = master.location.lat;
  const lng = master.location.lng;
  const distanceKm =
    userLat != null && userLng != null && lat != null && lng != null
      ? haversineKm(userLat, userLng, lat, lng)
      : null;
  const distanceLabel = formatDistanceKm(distanceKm);
  const visitChip = visitChipLabel(master.location.visitType);
  const showVerified = master.rating >= 4.5 && master.reviewsCount >= 10;
  const isNewMaster = master.reviewsCount <= 0 && master.rating <= 0;
  const bookingsCount = estimatedBookingsCount(master.reviewsCount);
  const hasSlot = Boolean(nearest?.label);

  return (
    <header className={`${catalogDesktopPanel} mb-4 overflow-hidden`}>
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-[16px] bg-[#EBEBEB] lg:mx-0 lg:h-52 lg:w-52">
          {master.photoUrl ? (
            <ImageReveal
              src={optimizeAvatarUrl(master.photoUrl, 520)}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[32px] font-bold text-[#F47C8C]">
              {initials(master.masterName)}
            </span>
          )}
          {hasSlot ? (
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-[8px] bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-[#15803D]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden />
              Свободна
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#8E8E93]">{formatMasterCardSpecialty(master.category)}</p>
          <div className="mt-1 flex items-start gap-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
              {master.masterName}
            </h1>
            {showVerified ? (
              <HiCheckBadge className="mt-2 h-6 w-6 shrink-0 text-[#F47C8C]" aria-label="Проверенный мастер" />
            ) : null}
          </div>

          <div className="mt-5 grid max-w-lg grid-cols-3 gap-3">
            {isNewMaster ? (
              <div className="rounded-[12px] bg-[#F5F5F5] px-3 py-3 text-center">
                <p className="text-[18px] font-bold text-[#F47C8C]">Новый</p>
                <p className="mt-0.5 text-[12px] text-[#9CA3AF]">мастер</p>
              </div>
            ) : (
              <div className="rounded-[12px] bg-[#F5F5F5] px-3 py-3 text-center">
                <p className="inline-flex items-center justify-center gap-1 text-[18px] font-bold text-[#111827]">
                  <HiStar className="h-4 w-4 text-amber-400" aria-hidden />
                  {master.rating > 0 ? master.rating.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
                  {master.reviewsCount > 0 ? formatReviewsCountLabel(master.reviewsCount) : 'нет отзывов'}
                </p>
              </div>
            )}
            <div className="rounded-[12px] bg-[#F5F5F5] px-3 py-3 text-center">
              <p className="text-[18px] font-bold text-[#111827]">{bookingsCount ?? '—'}</p>
              <p className="mt-0.5 text-[12px] text-[#9CA3AF]">записей</p>
            </div>
            <div className="rounded-[12px] bg-[#F5F5F5] px-3 py-3 text-center">
              <p className={`text-[18px] font-bold ${distanceLabel ? 'text-[#111827]' : 'text-[#D1D5DB]'}`}>
                {distanceLabel ?? '—'}
              </p>
              <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{distanceLabel ? 'от вас' : 'расстояние'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
              <HiMapPin className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
              {master.location.city?.trim() || 'Минск'}
              {master.location.district?.trim() && master.location.district !== '—'
                ? `, ${master.location.district}`
                : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
              <HiHomeModern className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
              {visitChip}
            </span>
          </div>

          <div
            className={`mt-4 flex items-center gap-3 rounded-[12px] px-4 py-3 ${
              hasSlot ? 'bg-[#FFF1F4]' : 'bg-[#F5F5F5]'
            }`}
          >
            <HiClock className={`h-5 w-5 shrink-0 ${hasSlot || nearestLoading ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`} />
            <p className="text-[14px] font-semibold text-[#111827]">
              {nearestLoading
                ? 'Ищем ближайшее окно…'
                : hasSlot
                  ? `Ближайшее окно: ${nearest!.label.toLowerCase()}`
                  : 'Свободных окон пока нет'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
