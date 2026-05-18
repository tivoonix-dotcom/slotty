import { Link } from 'react-router-dom';
import { HiStar, HiTrophy } from 'react-icons/hi2';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import {
  formatMasterCategoryLabel,
  formatMasterRatingLine,
  formatNearestSlotLabel,
  formatPriceFrom,
  shortMasterName,
} from '../lib/catalogFormat';
import { clientPinkBtn } from '../clientTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  items: ServiceListingRecord[];
  userLat: number | null;
  userLng: number | null;
};

const RANK_STYLE = [
  {
    label: '1',
    pedestal: 'h-[4.5rem]',
    photo: 'h-[4.5rem] w-[4.5rem] ring-[3px] ring-amber-300',
    badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.45)]',
    glow: 'shadow-[0_12px_32px_rgba(245,158,11,0.22)]',
    order: 'order-2',
    z: 'z-10',
    translate: '-translate-y-3',
  },
  {
    label: '2',
    pedestal: 'h-[3.25rem]',
    photo: 'h-[3.75rem] w-[3.75rem] ring-[3px] ring-[#C4C9D4]',
    badge: 'bg-gradient-to-br from-[#E8EBF0] to-[#B8BFCA] text-[#374151] shadow-md',
    glow: 'shadow-[0_8px_24px_rgba(17,24,39,0.08)]',
    order: 'order-1',
    z: 'z-0',
    translate: '',
  },
  {
    label: '3',
    pedestal: 'h-[2.75rem]',
    photo: 'h-[3.5rem] w-[3.5rem] ring-[3px] ring-[#E8B48A]',
    badge: 'bg-gradient-to-br from-[#F0D4B8] to-[#D4A574] text-white shadow-md',
    glow: 'shadow-[0_8px_24px_rgba(212,165,116,0.2)]',
    order: 'order-3',
    z: 'z-0',
    translate: '',
  },
] as const;

function TopMasterMiniCard({
  listing,
  rank,
  userLat: _lat,
  userLng: _lng,
}: {
  listing: ServiceListingRecord;
  rank: number;
  userLat: number | null;
  userLng: number | null;
}) {
  const rating = formatMasterRatingLine(listing);
  const slot = formatNearestSlotLabel(listing.nextSlotStartsAt);
  const style = RANK_STYLE[rank - 1] ?? RANK_STYLE[2];

  return (
    <div
      className={`flex w-[5.5rem] shrink-0 flex-col items-center ${style.order} ${style.z} ${style.translate}`}
    >
      <span
        className={`mb-2 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-[12px] font-bold ${style.badge}`}
      >
        {style.label}
      </span>

      <Link
        to={getMasterPath(listing.masterId)}
        className={`relative mb-2 overflow-hidden rounded-full ${style.photo} ${style.glow}`}
      >
        <ImageReveal src={listing.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </Link>

      <Link to={getMasterPath(listing.masterId)} className="w-full text-center">
        <p className="truncate px-0.5 text-[12px] font-semibold leading-tight text-[#111827]">
          {shortMasterName(listing.masterName, 14)}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-[#9CA3AF]">
          {formatMasterCategoryLabel(listing.category)}
        </p>
      </Link>

      <div className="mt-1.5 flex items-center justify-center gap-0.5 text-[11px] font-semibold text-[#92400E]">
        {!rating.isNew ? (
          <>
            <HiStar className="h-3 w-3 text-amber-400" aria-hidden />
            {rating.primary}
          </>
        ) : (
          <span className="text-[#F47C8C]">Новый</span>
        )}
      </div>

      {slot ? (
        <p className="mt-1 max-w-full truncate px-1 text-[10px] font-medium text-[#F47C8C]">{slot}</p>
      ) : null}

      <div
        className={`mt-2 w-full max-w-[5.25rem] rounded-t-[14px] bg-gradient-to-t from-[#F47C8C]/20 to-[#FFF1F4] ${style.pedestal}`}
        aria-hidden
      />

      <Link
        to={getBookingPath(
          listing.masterId,
          listing.primaryServiceId ?? null,
          listing.nextSlotId ?? null,
          { from: 'services' },
        )}
        className={`${clientPinkBtn} mt-2 min-h-9 w-full px-2 text-[11px]`}
      >
        Запись
      </Link>
    </div>
  );
}

function TopMasterWideCard({ listing, rank }: { listing: ServiceListingRecord; rank: number }) {
  const rating = formatMasterRatingLine(listing);
  const isFirst = rank === 1;

  return (
    <Link
      to={getMasterPath(listing.masterId)}
      className={`flex shrink-0 items-center gap-3 rounded-[22px] bg-white/90 p-3 shadow-[0_8px_28px_rgba(244,124,140,0.12)] backdrop-blur-sm transition active:scale-[0.98] ${
        isFirst ? 'w-[min(88vw,320px)]' : 'w-[min(78vw,280px)]'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[13px] font-bold text-[#F47C8C]">
        {rank}
      </span>
      <ImageReveal
        src={listing.photoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-[18px] object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[#111827]">
          {shortMasterName(listing.masterName, 20)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#6B7280]">
          {!rating.isNew ? (
            <>
              <HiStar className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-[#374151]">{rating.primary}</span>
              <span>· {rating.secondary}</span>
            </>
          ) : (
            <span>{rating.primary}</span>
          )}
        </p>
        <p className="mt-1 text-[13px] font-bold text-[#F47C8C]">{formatPriceFrom(listing.priceFrom)}</p>
      </div>
    </Link>
  );
}

export function TopMastersSection({ items }: Props) {
  if (!items.length) return null;

  const sorted = [...items].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount;
  });

  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const usePodium = podium.length >= 3;

  return (
    <section className="-mx-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] px-4 py-5 shadow-[0_12px_40px_rgba(244,124,140,0.08)] sm:-mx-5 sm:px-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#F47C8C] shadow-[0_6px_20px_rgba(244,124,140,0.18)]">
          <HiTrophy className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[#111827]">Топ мастера</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            Лучшие по рейтингу и отзывам — выбирайте с уверенностью
          </p>
        </div>
      </div>

      {usePodium ? (
        <div className="flex items-end justify-center gap-1 px-1 pb-1">
          {podium.map((listing, i) => (
            <TopMasterMiniCard
              key={listing.masterId}
              listing={listing}
              rank={i + 1}
              userLat={null}
              userLng={null}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto py-1.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {podium.map((listing, i) => (
            <div key={listing.masterId} className="snap-start">
              <TopMasterWideCard listing={listing} rank={i + 1} />
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Ещё в топе
          </p>
          <div className="flex gap-2.5 overflow-x-auto py-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rest.map((listing, i) => (
              <TopMasterWideCard key={listing.masterId} listing={listing} rank={i + 4} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
