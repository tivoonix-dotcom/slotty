import { useEffect, useMemo, type FC, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiCalendarDays, HiClock } from 'react-icons/hi2';
import { getBookingPath, SERVICES_PATH } from '../app/paths';
import {
  getServiceCategoryLabel,
  normalizeCategoryCode,
} from '../features/catalog/serviceCategoryLabels';
import type { ServiceListingRecord } from '../features/services/model/demoMasters';
import {
  CLIENT_DESKTOP_SHELL_BLEED_CLASS,
  CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS,
} from '../shared/layout/clientShellLayout';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { LoadingVideo } from '../shared/ui/LoadingVideo';
import { NothingFoundCard } from '../shared/ui/NothingFoundCard';
import { resolveServiceListingCoverUrl } from '../features/catalog/catalogServicePhotos';
import { useClientGeo } from './client/hooks/useClientGeo';
import { MasterCard } from './client/components/MasterCard';
import { ClientErrorModalProvider } from './client/ClientErrorModalContext';
import { formatPriceFrom, formatSlotCardSubline } from './client/lib/catalogFormat';
import { homePinkBtn, homeScrollRow, homeSection } from './home/homeTheme';

const COL_TITLE =
  'text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]';

const CARD_WIDTH = 'w-[min(88vw,21.25rem)] shrink-0 snap-start sm:w-[21.25rem]';

const COL_SCROLL =
  `${homeScrollRow} !mx-0 max-h-none items-stretch overflow-x-auto overflow-y-hidden pb-2`;

function listingCategoryKey(listing: ServiceListingRecord): string {
  const code = listing.categoryCode?.trim();
  if (code) return normalizeCategoryCode(code);
  const label = listing.category?.trim();
  if (label) return normalizeCategoryCode(label);
  return 'other';
}

function listingSortScore(listing: ServiceListingRecord): number {
  return listing.rating * 1000 + listing.reviewsCount;
}

/** По одной карточке на категорию (лучший рейтинг в категории). */
export function pickOneListingPerCategory(listings: ServiceListingRecord[]): ServiceListingRecord[] {
  const byCategory = new Map<string, ServiceListingRecord>();
  for (const item of listings) {
    const key = listingCategoryKey(item);
    const prev = byCategory.get(key);
    if (!prev || listingSortScore(item) > listingSortScore(prev)) {
      byCategory.set(key, item);
    }
  }
  return [...byCategory.values()];
}

function ServiceHomeCard({ listing }: { listing: ServiceListingRecord }) {
  const navigate = useNavigate();
  const hasSlot = Boolean(listing.nextSlotId && listing.nextSlotStartsAt);
  const slotSubline = hasSlot ? formatSlotCardSubline(listing.nextSlotStartsAt!) : null;
  const preview =
    listing.serviceCoverUrl ??
    resolveServiceListingCoverUrl({
      category: listing.category,
      categoryCode: listing.categoryCode,
      serviceName: listing.serviceName,
    });

  const openBooking = () => {
    navigate(
      getBookingPath(
        listing.masterId,
        listing.primaryServiceId,
        listing.nextSlotId,
        { from: 'services' },
      ),
    );
  };

  return (
    <article className="flex h-full min-h-[26.5rem] w-full flex-col rounded-[16px] bg-[#F6F6F7] p-4">
      <div className="shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F47C8C]">
          {getServiceCategoryLabel(listing.category)}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#111827]">
          {listing.serviceName}
        </h3>
        <p className="mt-1 truncate text-[13px] font-medium text-[#6B7280]">{listing.masterName}</p>
      </div>

      <div className="mt-4 h-[8.5rem] w-full shrink-0 overflow-hidden rounded-[14px] bg-[#EBEBEB]">
        <ImageReveal src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="mt-auto flex shrink-0 items-center gap-2.5 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[#F47C8C]">
          <HiClock className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[#9CA3AF]">Ближайшее окно</p>
          <p
            className={`mt-1 text-[14px] leading-snug ${
              hasSlot && slotSubline ? 'font-semibold text-[#F47C8C]' : 'font-medium text-[#6B7280]'
            }`}
          >
            {hasSlot && slotSubline ? slotSubline : 'Свободных окон пока нет'}
          </p>
        </div>
        <p className="shrink-0 text-right text-[13px] font-semibold text-[#111827]">
          {formatPriceFrom(listing.priceFrom)}
        </p>
      </div>

      <button
        type="button"
        onClick={openBooking}
        className="mt-3 flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#F47C8C] text-[14px] font-semibold text-white active:scale-[0.98]"
      >
        <HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />
        Записаться
      </button>
    </article>
  );
}

type HomeRowProps = {
  title: string;
  titleId?: string;
  className?: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText: string;
  emptyAction: ReactNode;
  children: ReactNode;
};

function HomeCatalogRow({
  title,
  titleId,
  className = '',
  isLoading,
  isEmpty,
  emptyTitle,
  emptyText,
  emptyAction,
  children,
}: HomeRowProps) {
  return (
    <div className={className}>
      <h2 id={titleId} className={COL_TITLE}>
        {title}
      </h2>
      <div className={COL_SCROLL}>
        {isLoading ? (
          <div className={`${CARD_WIDTH} flex min-h-[14rem] items-center justify-center`}>
            <LoadingVideo size="lg" label={`Загрузка: ${title.toLowerCase()}…`} />
          </div>
        ) : isEmpty ? (
          <div className={`${CARD_WIDTH} w-full min-w-[min(88vw,21.25rem)]`}>
            <NothingFoundCard title={emptyTitle} text={emptyText} action={emptyAction} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export type HomeTopMastersProps = {
  masters: ServiceListingRecord[];
  isLoading: boolean;
};

export const HomeTopMasters: FC<HomeTopMastersProps> = ({ masters, isLoading }) => {
  const { userLat, userLng, hasGeo, requestGeo } = useClientGeo();

  const masterRowListings = useMemo(() => pickOneListingPerCategory(masters), [masters]);
  const serviceRowListings = useMemo(() => pickOneListingPerCategory(masters), [masters]);

  useEffect(() => {
    if (!hasGeo) requestGeo();
  }, [hasGeo, requestGeo]);

  return (
    <section
      className={homeSection}
      style={{ animationDelay: '140ms' }}
      aria-labelledby="top-masters-col-heading"
    >
      <ClientErrorModalProvider>
        <div className={`${CLIENT_DESKTOP_SHELL_BLEED_CLASS} mr-[calc(50%-50vw)]`}>
          <div className={`space-y-8 sm:space-y-10 ${CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS}`}>
            <HomeCatalogRow
              title="Мастера"
              titleId="top-masters-col-heading"
              isLoading={isLoading}
              isEmpty={masterRowListings.length === 0}
              emptyTitle="Мастера скоро появятся"
              emptyText="Откройте каталог и выберите услугу."
              emptyAction={
                <Link to={SERVICES_PATH} className={`${homePinkBtn} w-full max-w-xs`}>
                  Все мастера
                </Link>
              }
            >
              {masterRowListings.map((listing) => (
                <div key={listing.masterId} className={CARD_WIDTH}>
                  <MasterCard listing={listing} userLat={userLat} userLng={userLng} layout="home" />
                </div>
              ))}
            </HomeCatalogRow>

            <HomeCatalogRow
              title="Услуги"
              isLoading={isLoading}
              isEmpty={serviceRowListings.length === 0}
              emptyTitle="Услуги скоро появятся"
              emptyText="Выберите категорию в каталоге."
              emptyAction={
                <Link to={SERVICES_PATH} className={`${homePinkBtn} w-full max-w-xs`}>
                  Все услуги
                </Link>
              }
            >
              {serviceRowListings.map((listing) => (
                <div key={`${listing.masterId}-${listing.id}`} className={CARD_WIDTH}>
                  <ServiceHomeCard listing={listing} />
                </div>
              ))}
            </HomeCatalogRow>
          </div>
        </div>
      </ClientErrorModalProvider>
    </section>
  );
};
