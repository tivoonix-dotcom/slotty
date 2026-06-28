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
import { sortMastersByTopRank } from '../../../features/masters/lib/masterTopScore';
import { TOP_MASTERS_PODIUM_BG, type TopMastersPodiumRank } from '../lib/topMastersPodiumAssets';
import { MasterInlineBadges } from '../../../shared/ui/MasterInlineBadges';
import { MasterCardPortrait } from './MasterCardPortrait';

type Props = {
  items: ServiceListingRecord[];
  userLat: number | null;
  userLng: number | null;
  /** mobile — полноширинная секция в ленте; desktop — компактный блок под табами каталога */
  variant?: 'mobile' | 'desktop';
  title?: string;
  subtitle?: string;
  /** false — остальные места показываются снаружи (например, отдельной каруселью) */
  showMoreInSection?: boolean;
  /** Всегда рисовать пьедестал 1–2–3, даже если мастеров меньше трёх */
  forcePodiumLayout?: boolean;
};

const RANK_STYLE = [
  {
    label: '1',
    columnWidth: 'w-[7.75rem] sm:w-[8.25rem]',
    pedestalHeight: 'h-[4.75rem] sm:h-[5rem]',
    photo: 'h-[4.5rem] w-[4.5rem] ring-[3px] ring-amber-300',
    badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white',
    glow: 'shadow-[0_12px_32px_rgba(245,158,11,0.22)]',
    order: 'order-2',
    z: 'z-10',
    translate: '-translate-y-3',
    bgPosition: '78% 100%',
  },
  {
    label: '2',
    columnWidth: 'w-[7rem] sm:w-[7.5rem]',
    pedestalHeight: 'h-[4rem] sm:h-[4.25rem]',
    photo: 'h-[3.75rem] w-[3.75rem] ring-[3px] ring-[#C4C9D4]',
    badge: 'bg-gradient-to-br from-[#E8EBF0] to-[#B8BFCA] text-[#374151]',
    glow: 'shadow-[0_8px_24px_rgba(17,24,39,0.08)]',
    order: 'order-1',
    z: 'z-0',
    translate: '',
    bgPosition: '76% 100%',
  },
  {
    label: '3',
    columnWidth: 'w-[6.75rem] sm:w-[7.25rem]',
    pedestalHeight: 'h-[3.75rem] sm:h-[4rem]',
    photo: 'h-[3.5rem] w-[3.5rem] ring-[3px] ring-[#E8B48A]',
    badge: 'bg-gradient-to-br from-[#F0D4B8] to-[#D4A574] text-white',
    glow: 'shadow-[0_8px_24px_rgba(212,165,116,0.2)]',
    order: 'order-3',
    z: 'z-0',
    translate: '',
    bgPosition: '74% 100%',
  },
] as const;

function podiumBg(rank: number): string {
  const key = Math.min(3, Math.max(1, rank)) as TopMastersPodiumRank;
  return TOP_MASTERS_PODIUM_BG[key];
}

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
      className={`flex ${style.columnWidth} shrink-0 flex-col items-center ${style.order} ${style.z} ${style.translate}`}
    >
      <div className="flex w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06]">
        <div className="flex flex-col items-center px-2 pb-2 pt-2.5">
          <span
            className={`mb-2 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-[12px] font-bold ${style.badge}`}
          >
            {style.label}
          </span>

          <Link
            to={getMasterPath(listing.masterId)}
            className={`mb-2 overflow-hidden rounded-full ${style.photo} ${style.glow}`}
          >
            <MasterCardPortrait
              masterName={listing.masterName}
              photoUrl={listing.photoUrl}
              className="relative h-full w-full"
              imageClassName="h-full w-full rounded-full object-cover"
            />
          </Link>

          <Link to={getMasterPath(listing.masterId)} className="w-full text-center">
            <div className="flex items-center justify-center gap-0.5 px-0.5">
              <p className="truncate text-[12px] font-semibold leading-tight text-[#111827]">
                {shortMasterName(listing.masterName, 14)}
              </p>
              {listing.isProEntitled ? <MasterInlineBadges pro size="xs" /> : null}
            </div>
            <p className="mt-0.5 truncate text-[10px] font-medium text-[#4B5563]">
              {formatMasterCategoryLabel(listing.category)}
            </p>
          </Link>

          <div className="mt-1.5 flex items-center justify-center gap-0.5 text-[11px] font-semibold text-[#111827]">
            {!rating.isNew ? (
              <>
                <HiStar className="h-3 w-3 text-amber-400" aria-hidden />
                {rating.primary}
              </>
            ) : (
              <span className="text-[#C02658]">Новый</span>
            )}
          </div>

          {slot ? (
            <p className="mt-1 max-w-full truncate px-1 text-[10px] font-semibold text-[#374151]">
              {slot}
            </p>
          ) : null}
        </div>

        <div
          className={`w-full shrink-0 bg-cover bg-no-repeat ${style.pedestalHeight}`}
          style={{
            backgroundImage: `url(${podiumBg(rank)})`,
            backgroundPosition: style.bgPosition,
          }}
          aria-hidden
        />
      </div>

      <Link
        to={getBookingPath(
          listing.masterId,
          listing.primaryServiceId ?? null,
          listing.nextSlotId ?? null,
          { from: 'services' },
        )}
        className={`${catalogPrimaryBtn} mt-2 min-h-9 w-full px-2 text-[11px]`}
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
      <MasterCardPortrait
        masterName={listing.masterName}
        photoUrl={listing.photoUrl}
        className="relative h-14 w-14 shrink-0"
        imageClassName="h-14 w-14 rounded-[18px] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1">
          <p className="truncate text-[15px] font-semibold text-[#111827]">
            {shortMasterName(listing.masterName, 20)}
          </p>
          {listing.isProEntitled ? <MasterInlineBadges pro size="xs" /> : null}
        </div>
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

function TopMasterPodiumSpacer({ rank }: { rank: 2 | 3 }) {
  const style = RANK_STYLE[rank - 1];
  return (
    <div
      className={`flex ${style.columnWidth} shrink-0 flex-col items-center opacity-35 ${style.order} ${style.z} ${style.translate}`}
      aria-hidden
    >
      <div className="flex w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06]">
        <div className="h-[7.5rem] bg-white" />
        <div
          className={`w-full shrink-0 bg-cover bg-no-repeat ${style.pedestalHeight}`}
          style={{
            backgroundImage: `url(${podiumBg(rank)})`,
            backgroundPosition: style.bgPosition,
          }}
        />
      </div>
    </div>
  );
}

export function TopMastersSection({
  items,
  variant = 'mobile',
  title = 'Топ мастера',
  subtitle = 'Рейтинг, отзывы и записи — честный топ по активности',
  showMoreInSection = true,
  forcePodiumLayout = false,
}: Props) {
  if (!items.length) return null;

  const isDesktop = variant === 'desktop';
  const sorted = sortMastersByTopRank(items);

  const top3 = sorted.slice(0, 3);
  const rest = isDesktop || !showMoreInSection ? [] : sorted.slice(3);
  const usePodium = forcePodiumLayout || top3.length >= 3;

  const podiumEntries: Array<{ listing: ServiceListingRecord | null; rank: number }> = usePodium
    ? top3.length >= 3
      ? [
          { listing: top3[1]!, rank: 2 },
          { listing: top3[0]!, rank: 1 },
          { listing: top3[2]!, rank: 3 },
        ]
      : top3.length === 2
        ? [
            { listing: top3[1]!, rank: 2 },
            { listing: top3[0]!, rank: 1 },
            { listing: null, rank: 3 },
          ]
        : [{ listing: null, rank: 2 }, { listing: top3[0]!, rank: 1 }, { listing: null, rank: 3 }]
    : [];

  return (
    <section
      className={
        isDesktop
          ? 'overflow-hidden rounded-[16px] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] px-5 py-4'
          : '-mx-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] px-4 py-5 sm:-mx-5 sm:px-5'
      }
    >
      <div className={`flex items-start gap-3 ${isDesktop ? 'mb-3' : 'mb-4'}`}>
        <span
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-white text-[#F47C8C] ${
            isDesktop ? 'h-10 w-10' : 'h-11 w-11'
          }`}
        >
          <HiTrophy className={isDesktop ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden />
        </span>
        <div>
          <h2
            className={`font-semibold tracking-tight text-[#111827] ${
              isDesktop ? 'text-[18px]' : 'text-[22px]'
            }`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {usePodium ? (
        <div
          className={`flex items-end justify-center pb-1 ${
            isDesktop ? 'gap-4 px-1' : 'gap-2 px-0.5'
          }`}
        >
          {podiumEntries.map(({ listing, rank }) =>
            listing ? (
              <TopMasterMiniCard
                key={listing.masterId}
                listing={listing}
                rank={rank}
                userLat={null}
                userLng={null}
              />
            ) : (
              <TopMasterPodiumSpacer key={`spacer-${rank}`} rank={rank as 2 | 3} />
            ),
          )}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto py-1.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {top3.map((listing, i) => (
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
