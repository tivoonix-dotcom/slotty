import { useCallback, useMemo, useState } from 'react';
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
  formatMasterCategoryLabel,
  formatPriceFrom,
  formatSlotCardSubline,
  isSlotToday,
  masterLocationShortLine,
  visitFormatLabel,
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

export function MasterCard({ listing, userLat: _userLat, userLng: _userLng, layout = 'list' }: Props) {
  const navigate = useNavigate();
  const { fav, onToggleFav } = useFavorite(listing.masterId);
  const featured = layout === 'featured';

  const hasSlot = Boolean(listing.nextSlotStartsAt);
  const slotToday = isSlotToday(listing.nextSlotStartsAt);
  const slotSubline = formatSlotCardSubline(listing.nextSlotStartsAt);
  const showVerified = listing.rating >= 4.5 && listing.reviewsCount >= 10;
  const isNewMaster = listing.reviewsCount <= 0 && listing.rating <= 0;

  const priceLabel =
    listing.priceFrom > 0 ? formatPriceFrom(listing.priceFrom) : null;

  const portfolioUrls = useMemo(
    () => uniquePortfolioUrls(listing.portfolioPreview),
    [listing.portfolioPreview],
  );
  const previewPhotos = portfolioUrls.slice(0, 3);
  const extraWorks =
    (listing.portfolioTotal ?? portfolioUrls.length) > previewPhotos.length
      ? (listing.portfolioTotal ?? portfolioUrls.length) - previewPhotos.length
      : 0;

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

  const photoBadge = slotToday ? 'Сегодня' : hasSlot ? 'Свободна' : null;

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
      {/* Верх: фото + инфо */}
      <div className="flex gap-3.5">
        <div className="relative h-[8.25rem] w-[6.75rem] shrink-0 sm:h-[8.75rem] sm:w-[7.25rem]">
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
          {photoBadge ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#15803D] shadow-sm">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden />
              {photoBadge}
            </span>
          ) : null}
        </div>

        <div className="relative min-w-0 flex-1 pt-0.5">
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
              {formatMasterCategoryLabel(listing.category)}
            </p>
          </div>

          <div className="mt-2.5">
            {isNewMaster ? (
              <p className="text-[13px] font-semibold text-[#F47C8C]">Новый мастер</p>
            ) : (
              <p className="flex flex-wrap items-center gap-1 text-[13px] text-[#374151]">
                <HiStar className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <span className="font-semibold text-[#111827]">
                  {listing.rating > 0 ? listing.rating.toFixed(1) : '—'}
                </span>
                {listing.reviewsCount > 0 ? (
                  <>
                    <span className="text-[#D1D5DB]">·</span>
                    <span className="text-[#6B7280]">
                      {formatReviewsCountLabel(listing.reviewsCount)}
                    </span>
                  </>
                ) : (
                  <span className="text-[#9CA3AF]"> · Пока нет отзывов</span>
                )}
              </p>
            )}
          </div>

          <p className="mt-2 line-clamp-1 text-[12px] text-[#6B7280]">
            <HiMapPin className="mr-0.5 inline h-3.5 w-3.5 -translate-y-px text-[#9CA3AF]" aria-hidden />
            {masterLocationShortLine(listing)}
            <span className="text-[#D1D5DB]"> · </span>
            <HiHomeModern className="mr-0.5 inline h-3.5 w-3.5 -translate-y-px text-[#9CA3AF]" aria-hidden />
            {visitFormatLabel(listing)}
          </p>
        </div>
      </div>

      {/* Ближайшее окно */}
      <div
        className={`mt-3.5 flex items-center gap-3 rounded-[18px] px-3.5 py-3 ${
          hasSlot ? 'bg-gradient-to-r from-[#FFF5F7] to-[#FFEEF2]' : 'bg-[#FAFAFA]'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
            hasSlot ? 'bg-white text-[#F47C8C]' : 'bg-[#F1EFEF] text-[#9CA3AF]'
          }`}
        >
          <HiClock className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Ближайшее окно
          </p>
          {hasSlot && slotSubline ? (
            <p className="mt-0.5 text-[15px] font-semibold capitalize text-[#F47C8C]">{slotSubline}</p>
          ) : (
            <p className="mt-0.5 text-[14px] font-medium text-[#6B7280]">Свободных окон пока нет</p>
          )}
        </div>
        {hasSlot && priceLabel ? (
          <div className="shrink-0 border-l border-[#F47C8C]/15 pl-3 text-right">
            <p className="text-[15px] font-bold text-[#111827]">{priceLabel}</p>
            {listing.serviceName ? (
              <p className="mt-0.5 line-clamp-1 max-w-[5.5rem] text-[11px] text-[#9CA3AF]">
                {listing.serviceName}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Портфолио */}
      {previewPhotos.length > 0 ? (
        <div className="mt-3.5 flex gap-2">
          {previewPhotos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="h-[4.25rem] flex-1 overflow-hidden rounded-[16px] bg-[#FAFAFA]"
            >
              <ImageReveal src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
          {extraWorks > 0 ? (
            <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[12px] font-bold leading-tight text-[#F47C8C]">
              +{extraWorks}
              <br />
              работ
            </div>
          ) : null}
        </div>
      ) : null}

      {/* CTA */}
      <button
        type="button"
        onClick={openBooking}
        className={`${clientPinkBtn} mt-4 min-h-[50px] w-full gap-2 text-[15px]`}
      >
        <HiCalendarDays className="h-5 w-5 shrink-0" aria-hidden />
        {hasSlot ? 'Выбрать время' : 'Смотреть профиль'}
      </button>
    </article>
  );
}
