import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiHeart,
  HiHomeModern,
  HiMapPin,
  HiStar,
} from 'react-icons/hi2';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import {
  estimatedBookingsCount,
  formatDistanceKm,
  formatMasterCardSpecialty,
  formatPriceFrom,
  formatSlotCardSubline,
  listingDistanceKm,
  masterLocationChipLine,
  visitFormatChipLabel,
} from '../lib/catalogFormat';
import { clientPinkBtn } from '../clientTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  addMyFavoriteMaster,
  removeMyFavoriteMaster,
} from '../../../features/profile/api/clientFavorites';
import {
  isFavoriteMasterId,
  toggleFavoriteMasterId,
} from '../../../features/profile/lib/favoriteMastersStorage';

type Props = {
  listing: ServiceListingRecord;
  userLat: number | null;
  userLng: number | null;
  layout?: 'carousel' | 'list' | 'featured';
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name[0] ?? 'M').toUpperCase();
}

function useFavorite(masterId: string) {
  const [fav, setFav] = useState(() => isFavoriteMasterId(masterId));
  const onToggleFav = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = toggleFavoriteMasterId(masterId);
      setFav(next);
      try {
        if (next) await addMyFavoriteMaster(masterId);
        else await removeMyFavoriteMaster(masterId);
      } catch {
        /* local */
      }
    },
    [masterId],
  );
  return { fav, onToggleFav };
}

function uniquePortfolioUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = u?.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function StatColumn({
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

export function MasterCard({ listing, userLat, userLng, layout = 'list' }: Props) {
  const navigate = useNavigate();
  const { fav, onToggleFav } = useFavorite(listing.masterId);
  const featured = layout === 'featured';

  const hasSlot = Boolean(listing.nextSlotStartsAt);
  const slotSubline = formatSlotCardSubline(listing.nextSlotStartsAt);
  const showVerified = listing.rating >= 4.5 && listing.reviewsCount >= 10;
  const isNewMaster = listing.reviewsCount <= 0 && listing.rating <= 0;
  const bookingsCount = estimatedBookingsCount(listing.reviewsCount);
  const distanceKm = listingDistanceKm(listing, userLat, userLng);
  const distanceLabel = formatDistanceKm(distanceKm);

  const priceLabel = listing.priceFrom > 0 ? formatPriceFrom(listing.priceFrom) : null;

  const { previewPhotos, extraWorks } = useMemo(() => {
    const urls = uniquePortfolioUrls(listing.portfolioPreview);
    if (urls.length >= 4) {
      const total = listing.portfolioTotal ?? urls.length;
      return {
        previewPhotos: urls.slice(0, 4),
        extraWorks: total > 4 ? total - 4 : 0,
      };
    }
    if (urls.length > 0) {
      return { previewPhotos: urls, extraWorks: 0 };
    }
    const categoryPhoto = getCategoryWorkPhotoUrl(resolveCategoryWorkCode(listing.category));
    const total = listing.portfolioTotal ?? 0;
    return {
      previewPhotos: [categoryPhoto],
      extraWorks: total > 1 ? total - 1 : 0,
    };
  }, [listing.portfolioPreview, listing.portfolioTotal, listing.category]);

  const profilePath = getMasterPath(listing.masterId);
  const bookingPath = getBookingPath(
    listing.masterId,
    listing.primaryServiceId ?? null,
    listing.nextSlotId ?? null,
    { from: 'services' },
  );

  const openProfile = () => navigate(profilePath);
  const openBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSlot) navigate(bookingPath);
    else navigate(profilePath);
  };

  const locationChip = masterLocationChipLine(listing);
  const visitChip = visitFormatChipLabel(listing);
  const serviceShort =
    listing.serviceName.length > 18
      ? `${listing.serviceName.slice(0, 17)}…`
      : listing.serviceName;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProfile();
        }
      }}
      className={`flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-white p-4 text-left shadow-[0_10px_36px_rgba(17,24,39,0.07)] ring-1 ring-[#f2f2f2] transition active:scale-[0.99] ${
        featured ? 'ring-2 ring-[#F47C8C]/20' : ''
      }`}
    >
      <div className="flex gap-3.5">
        <div className="relative h-[8.5rem] w-[7rem] shrink-0">
          {listing.photoUrl ? (
            <ImageReveal
              src={listing.photoUrl}
              alt=""
              className="h-full w-full rounded-[22px] object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-[22px] bg-gradient-to-br from-[#FFF1F4] to-[#FFE4EA] text-[22px] font-bold text-[#F47C8C]">
              {initials(listing.masterName)}
            </span>
          )}
          {hasSlot ? (
            <span className="absolute bottom-2 left-1.5 right-1.5 flex items-center justify-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#15803D] shadow-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
              Свободна
            </span>
          ) : null}
        </div>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleFav}
            aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
            className={`absolute -right-0.5 -top-0.5 z-10 flex h-9 w-9 items-center justify-center rounded-[14px] bg-white shadow-[0_4px_14px_rgba(17,24,39,0.08)] transition active:scale-95 ${
              fav ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'
            }`}
          >
            <HiHeart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
          </button>

          <div className="pr-9">
            <div className="flex items-start gap-1">
              <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-[#111827]">
                {listing.masterName}
              </h3>
              {showVerified ? (
                <HiCheckBadge className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
              ) : null}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-[#6B7280]">
              {formatMasterCardSpecialty(listing.category)}
            </p>
          </div>

          <div className="mt-3 flex items-start border-t border-[#F3F4F6] pt-2.5">
            {isNewMaster ? (
              <StatColumn
                value="Новый"
                label="мастер"
                valueClassName="text-[15px] font-bold text-[#F47C8C]"
              />
            ) : (
              <StatColumn
                value={
                  <span className="inline-flex items-center justify-center gap-0.5">
                    <HiStar className="h-4 w-4 text-amber-400" aria-hidden />
                    {listing.rating > 0 ? listing.rating.toFixed(1) : '—'}
                  </span>
                }
                label={
                  listing.reviewsCount > 0
                    ? formatReviewsCountLabel(listing.reviewsCount)
                    : 'нет отзывов'
                }
              />
            )}
            <div className="mx-1 w-px self-stretch bg-[#F3F4F6]" aria-hidden />
            {bookingsCount != null ? (
              <StatColumn value={String(bookingsCount)} label="записей" />
            ) : (
              <StatColumn value="—" label="записей" valueClassName="text-[17px] font-bold text-[#D1D5DB]" />
            )}
            <div className="mx-1 w-px self-stretch bg-[#F3F4F6]" aria-hidden />
            <StatColumn
              value={distanceLabel ?? '—'}
              label={distanceLabel ? 'от вас' : 'расстояние'}
              valueClassName={
                distanceLabel
                  ? 'text-[17px] font-bold text-[#111827]'
                  : 'text-[17px] font-bold text-[#D1D5DB]'
              }
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span className="truncate">{locationChip}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
              <HiHomeModern className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
              {visitChip}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mt-3.5 flex items-center gap-2.5 rounded-[18px] px-3 py-2.5 ${
          hasSlot ? 'bg-gradient-to-r from-[#FFF5F7] to-[#FFEEF2]' : 'bg-[#FAFAFA]'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
            hasSlot ? 'bg-white text-[#F47C8C] shadow-sm' : 'bg-[#F1EFEF] text-[#9CA3AF]'
          }`}
        >
          <HiClock className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Ближайшее окно
          </p>
          {hasSlot && slotSubline ? (
            <p className="mt-0.5 text-[14px] font-semibold lowercase text-[#F47C8C]">{slotSubline}</p>
          ) : (
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">Свободных окон пока нет</p>
          )}
        </div>
        {hasSlot && priceLabel ? (
          <>
            <div className="h-9 w-px shrink-0 bg-[#F47C8C]/15" aria-hidden />
            <div className="max-w-[5.25rem] shrink-0 text-right">
              <p className="text-[14px] font-bold leading-tight text-[#111827]">{priceLabel}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-[#9CA3AF]">
                {serviceShort}
              </p>
            </div>
          </>
        ) : null}
        {hasSlot ? (
          <button
            type="button"
            onClick={openBooking}
            aria-label="Выбрать время"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F47C8C] text-white shadow-sm active:scale-95"
          >
            <HiCalendarDays className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {previewPhotos.length > 0 ? (
        <div className="mt-3 flex gap-1.5">
          {previewPhotos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`h-[3.75rem] overflow-hidden rounded-[14px] bg-[#FAFAFA] ${
                previewPhotos.length === 1 ? 'w-[5.5rem] shrink-0' : 'min-w-0 flex-1'
              }`}
            >
              <ImageReveal src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
          {extraWorks > 0 ? (
            <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-[14px] bg-[#FFF1F4] px-1 text-center text-[11px] font-bold leading-tight text-[#F47C8C]">
              +{extraWorks}
              <span className="text-[10px] font-semibold">работы</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openBooking}
        className={`${clientPinkBtn} mt-3.5 min-h-[52px] w-full flex-col gap-0 py-2.5`}
      >
        <span className="text-[16px] font-semibold leading-tight">Записаться</span>
        <span className="text-[12px] font-medium leading-tight text-white/90">
          {hasSlot ? 'Выбрать время' : 'Открыть профиль'}
        </span>
      </button>
    </article>
  );
}
