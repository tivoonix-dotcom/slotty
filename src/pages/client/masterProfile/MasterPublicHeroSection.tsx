import type { ReactNode } from 'react';
import { HiCalendarDays, HiClock, HiHomeModern, HiMapPin, HiStar } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';
import { MasterVerifiedBadge } from '../../../shared/ui/MasterVerifiedBadge';
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
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { formatMasterProfileLocationChip, visitChipLabel } from './masterProfileUtils';
import { catalogDesktopPanel } from './masterProfileTheme';
import { MasterPublicCoverBanner, MasterPublicPortraitOverlap } from './MasterPublicCoverBanner';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  layout?: 'desktop' | 'mobile';
  onChooseTime?: () => void;
  className?: string;
};

type HeroMetrics = {
  isNewMaster: boolean;
  bookingsCount: number | null;
  distanceLabel: string | null;
  ratingText: string;
  reviewsText: string | null;
};

function useHeroMetrics(
  master: ExtendedMasterProfile,
  userLat: number | null,
  userLng: number | null,
): HeroMetrics {
  const { lat, lng } = masterDistanceCoords(master.location);
  const distanceKm =
    userLat != null && userLng != null && lat != null && lng != null
      ? haversineKm(userLat, userLng, lat, lng)
      : null;
  const isNewMaster = master.reviewsCount <= 0 && master.rating <= 0;
  const bookingsCount = estimatedBookingsCount(master.reviewsCount);
  const distanceLabel = formatDistanceKm(distanceKm);
  const ratingText =
    !isNewMaster && master.rating > 0 ? master.rating.toFixed(1) : isNewMaster ? 'Новый' : EMPTY_METRIC;
  const reviewsText =
    master.reviewsCount > 0 ? formatReviewsCountLabel(master.reviewsCount) : null;

  return { isNewMaster, bookingsCount, distanceLabel, ratingText, reviewsText };
}

/** Метрики под именем и чипами — не у баннера справа. */
function HeroStatsDesktopBand({ metrics }: { metrics: HeroMetrics }) {
  const { isNewMaster, bookingsCount, distanceLabel, ratingText, reviewsText } = metrics;

  return (
    <div className="mt-5 border-t border-[#F0F0F0] pt-4 lg:pl-[calc(7.5rem+1.25rem)] xl:pl-[calc(8.25rem+1.75rem)]">
      <div className="flex flex-col gap-2.5 text-[14px] leading-snug sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <HiStar className="h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
          {isNewMaster ? (
            <span className="font-semibold text-[#374151]">Новый мастер</span>
          ) : (
            <>
              <span className="font-bold tabular-nums text-[#111827]">{ratingText}</span>
              {reviewsText ? (
                <span className="text-[#6B7280]">· {reviewsText}</span>
              ) : (
                <span className="text-[#6B7280]">· пока без отзывов</span>
              )}
            </>
          )}
        </p>

        <p className="text-[#374151]">
          {bookingsCount != null && bookingsCount > 0 ? (
            <>
              <span className="font-bold tabular-nums text-[#F47C8C]">{bookingsCount}</span>
              <span className="text-[#6B7280]"> записей выполнено</span>
            </>
          ) : (
            <span className="text-[#6B7280]">Пока нет записей</span>
          )}
        </p>

        <p className="text-[#6B7280]">
          {distanceLabel ? (
            <>
              <span className="font-bold tabular-nums text-[#111827]">{distanceLabel}</span> от вас
            </>
          ) : (
            'Расстояние не определено'
          )}
        </p>
      </div>
    </div>
  );
}

function HeroStatRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="inline-flex items-center gap-2 text-[13px] text-[#6B7280]">
        {icon}
        {label}
      </span>
      <span className="text-right text-[13px] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function HeroStatsRows({ metrics }: { metrics: HeroMetrics }) {
  const { isNewMaster, bookingsCount, distanceLabel, ratingText, reviewsText } = metrics;

  return (
    <div className="space-y-2">
      <HeroStatRow
        icon={<HiStar className="h-4 w-4 text-[#F59E0B]" aria-hidden />}
        label="Рейтинг"
        value={
          isNewMaster ? (
            <span className="text-[#374151]">Новый мастер</span>
          ) : (
            <span className="inline-flex items-center gap-1 tabular-nums">
              {ratingText}
              {reviewsText ? (
                <span className="font-normal text-[#9CA3AF]">· {reviewsText}</span>
              ) : null}
            </span>
          )
        }
      />
      <HeroStatRow
        icon={<HiCalendarDays className="h-4 w-4 text-[#F47C8C]" aria-hidden />}
        label="Записей"
        value={
          bookingsCount != null && bookingsCount > 0 ? (
            bookingsCount
          ) : (
            <span className="font-normal text-[#9CA3AF]">{EMPTY_METRIC}</span>
          )
        }
      />
      <HeroStatRow
        icon={<HiMapPin className="h-4 w-4 text-[#9CA3AF]" aria-hidden />}
        label="От вас"
        value={
          distanceLabel ?? (
            <span className="font-normal text-[#9CA3AF]">{EMPTY_DISTANCE}</span>
          )
        }
      />
    </div>
  );
}

function LocationChips({
  locationChip,
  visitChip,
}: {
  locationChip: string;
  visitChip: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
        <HiMapPin className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        <span className="truncate">{locationChip}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
        <HiHomeModern className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        {visitChip}
      </span>
    </div>
  );
}

/**
 * Шапка публичного профиля: обложка + аватар + имя; метрики полосой под именем (не у фото).
 */
export function MasterPublicHeroSection({
  master,
  userLat,
  userLng,
  nearest,
  nearestLoading,
  layout = 'desktop',
  onChooseTime,
  className = '',
}: Props) {
  const isMobile = layout === 'mobile';
  const metrics = useHeroMetrics(master, userLat, userLng);
  const visitChip = visitChipLabel(master.location.visitType);
  const locationChip = formatMasterProfileLocationChip(master.location);
  const showVerified = masterShowsVerifiedBadge(master);
  const hasSlot = Boolean(nearest?.label);

  const coverHeight = isMobile ? 'h-[140px]' : 'h-[180px] sm:h-[220px] lg:h-[220px]';
  const avatarSize = isMobile
    ? 'h-[104px] w-[104px]'
    : 'h-[120px] w-[120px] lg:h-[132px] lg:w-[132px]';
  const overlapMt = isMobile ? '-mt-[48px]' : '-mt-[60px] lg:-mt-[66px]';
  const identityPt = isMobile ? 'pt-[70px]' : 'pt-[60px] lg:pt-[66px]';

  return (
    <header className={`${catalogDesktopPanel} overflow-hidden ${className}`}>
      <MasterPublicCoverBanner master={master} heightClass={coverHeight} />

      <div className={`bg-white ${isMobile ? 'px-4 pb-4' : 'px-6 pb-6 lg:px-8'}`}>
        <div className={overlapMt}>
          <div className="flex min-w-0 gap-4 sm:gap-5 lg:gap-7 xl:gap-8">
            <MasterPublicPortraitOverlap
              master={master}
              className={`relative shrink-0 ${avatarSize}`}
            />

            <div className={`min-w-0 flex-1 ${identityPt}`}>
              <div className="flex items-start gap-1.5">
                <h1
                  className={`min-w-0 font-bold leading-tight tracking-[-0.03em] text-[#111827] ${
                    isMobile ? 'text-[20px]' : 'text-[24px] lg:text-[28px]'
                  }`}
                >
                  {master.masterName}
                </h1>
                {showVerified ? (
                  <MasterVerifiedBadge
                    className={`shrink-0 text-[#F47C8C] ${isMobile ? 'mt-1 h-4 w-4' : 'mt-1.5 h-6 w-6'}`}
                  />
                ) : null}
              </div>

              <p className={`mt-1 font-medium text-[#6B7280] ${isMobile ? 'text-[14px]' : 'text-[15px]'}`}>
                {formatMasterCardSpecialty(master.category)}
              </p>

              {hasSlot ? (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[12px] font-semibold text-[#15803D] ring-1 ring-[#22C55E]/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden />
                  Свободна для записи
                </span>
              ) : null}

              {!isMobile ? (
                <div className="mt-4 hidden max-w-xl lg:block">
                  <LocationChips locationChip={locationChip} visitChip={visitChip} />
                </div>
              ) : null}
            </div>
          </div>

          {!isMobile ? <HeroStatsDesktopBand metrics={metrics} /> : null}
        </div>

        {isMobile ? (
          <div className="mt-4 border-t border-[#F0F0F0] pt-4">
            <HeroStatsRows metrics={metrics} />
          </div>
        ) : null}

        {isMobile ? (
          <div className="mt-3">
            <LocationChips locationChip={locationChip} visitChip={visitChip} />
          </div>
        ) : null}

        <div className="mt-4 rounded-[12px] border border-[#F0F0F0] bg-[#FAFAFA] px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <HiClock
              className={`mt-0.5 h-5 w-5 shrink-0 ${hasSlot || nearestLoading ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[#9CA3AF]">Ближайшее окно</p>
              <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">
                {nearestLoading
                  ? 'Ищем ближайшее окно…'
                  : hasSlot
                    ? nearest!.label
                    : 'Свободных окон пока нет'}
              </p>
            </div>
          </div>

          {isMobile && onChooseTime ? (
            <button
              type="button"
              onClick={onChooseTime}
              className={`${clientPinkBtn} mt-3 flex w-full items-center justify-center gap-1.5 !min-h-11 !rounded-[10px] !text-[14px]`}
            >
              <HiCalendarDays className="h-4 w-4" aria-hidden />
              {hasSlot ? 'Выбрать время' : 'Смотреть услуги'}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
