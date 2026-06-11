import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingPath, SERVICES_PATH } from '../app/paths';
import { fetchPublicSlots, type PublicSlotDto } from '../features/booking/api/publicSlotsApi';
import { getLocalTodayIsoRange } from '../features/landing/homeLandingBounds';
import { masterListingPortraitUrl } from '../features/masters/lib/masterListingPortrait';
import { MasterCardPortrait } from './client/components/MasterCardPortrait';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { fetchPublishedMasters, type PublishedMasterDto } from '../features/services/api/publishedMastersApi';
import { formatReviewsCountLabel } from '../features/services/model/demoMasters';
import { getApiBaseUrl } from '../shared/api/backendClient';
import { LoadingVideo } from '../shared/ui/LoadingVideo';
import {
  homeCard,
  homePinkBtn,
  homeScrollRow,
  homeSection,
  homeSectionSubtitle,
  homeSectionTitle,
} from './home/homeTheme';

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

type QuickRow = {
  key: string;
  slot: PublicSlotDto;
  masterName: string;
  photoUrl: string;
  rating: number;
  reviewsCount: number;
  dateLabel: string;
  timeLabel: string;
};

function buildRows(slots: PublicSlotDto[], masters: PublishedMasterDto[]): QuickRow[] {
  const byMaster = new Map(masters.map((m) => [m.masterId, m]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return slots.map((slot) => {
    const m = byMaster.get(slot.masterId);
    const start = new Date(slot.startsAt);
    const slotDay = new Date(start);
    slotDay.setHours(0, 0, 0, 0);
    const dateLabel =
      slotDay.getTime() === today.getTime()
        ? 'Сегодня'
        : start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const timeLabel = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    let photoUrl = '';
    let rating = 0;
    let reviewsCount = 0;

    const masterName = (m?.displayName ?? slot.masterDisplayName).trim() || 'Мастер';
    if (m) {
      photoUrl = masterListingPortraitUrl(m.photoUrl);
      rating = m.rating;
      reviewsCount = m.reviewsCount;
    } else {
      photoUrl = '';
    }

    return {
      key: slot.id,
      slot,
      masterName,
      photoUrl,
      rating,
      reviewsCount,
      dateLabel,
      timeLabel,
    };
  });
}

function formatPrice(price: number): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n} BYN`;
}

export const HomeQuickSlots: FC = () => {
  const navigate = useNavigate();
  const hasApi = Boolean(getApiBaseUrl());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-quick-slots'],
    enabled: hasApi,
    queryFn: async () => {
      const { from, to } = getLocalTodayIsoRange();
      const [slots, masters] = await Promise.all([
        fetchPublicSlots({ from, to, limit: 12 }),
        fetchPublishedMasters({ limit: 80 }),
      ]);
      return { slots, masters };
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return buildRows(data.slots, data.masters);
  }, [data]);

  const goBook = (slot: PublicSlotDto) => {
    void setProfileRole('client');
    navigate(getBookingPath(slot.masterId, slot.bookingServiceId, slot.id, { from: 'services' }));
  };

  if (!hasApi) return null;

  if (!isLoading && !isError && rows.length === 0) return null;

  return (
    <section
      className={`${homeSection} w-full min-w-0 max-w-full`}
      style={{ animationDelay: '80ms' }}
      aria-labelledby="home-quick-slots-heading"
    >
      <div className="mb-4 px-0.5">
        <h2 id="home-quick-slots-heading" className={homeSectionTitle}>
          Ближайшие свободные окна
        </h2>
        <p className={homeSectionSubtitle}>Запишитесь на сегодня — без звонков и переписок.</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[12rem] items-center justify-center rounded-[28px] bg-white px-4 py-10 ring-1 ring-[#F3F4F6] shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <LoadingVideo size="lg" label="Загрузка окон…" />
        </div>
      ) : isError ? (
        <div className="rounded-[28px] bg-white px-5 py-8 text-center ring-1 ring-[#F3F4F6] shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="text-[16px] font-semibold text-[#374151]">Не удалось загрузить окна</p>
          <Link to={SERVICES_PATH} className={`mt-5 ${homePinkBtn} px-6 text-[15px]`}>
            Открыть каталог
          </Link>
        </div>
      ) : (
        <div className={homeScrollRow}>
          {rows.map((row, index) => {
            const slot = row.slot;
            const priceLabel = formatPrice(slot.servicePrice);
            const eager = index < 6;
            return (
              <article
                key={row.key}
                role="button"
                tabIndex={0}
                className={`w-[min(16.5rem,78vw)] shrink-0 cursor-pointer outline-none transition active:scale-[0.99] sm:w-64 ${homeCard}`}
                onClick={() => goBook(slot)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goBook(slot);
                  }
                }}
                aria-label={`Запись: ${slot.serviceTitle} у ${slot.masterDisplayName}`}
              >
                <div className="p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">Услуга</p>
                  <p className="mt-0.5 truncate text-[15px] font-semibold text-[#111827]">{slot.serviceTitle}</p>

                  <div className="mt-3 flex gap-3">
                    <MasterCardPortrait
                      masterName={row.masterName}
                      photoUrl={row.photoUrl}
                      className="relative h-12 w-12 shrink-0 overflow-hidden"
                      imageClassName="h-12 w-12 rounded-2xl object-cover"
                      loading={eager ? 'eager' : 'lazy'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">Мастер</p>
                      <p className="truncate text-[14px] font-semibold text-[#111827]">{slot.masterDisplayName}</p>
                      {row.rating > 0 ? (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#374151]">
                            <IconStar className="text-[#F47C8C]" />
                            {row.rating.toFixed(1)}
                          </span>
                          <span className="text-[12px] text-[#9CA3AF]">{formatReviewsCountLabel(row.reviewsCount)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#F1EFEF] pt-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#9CA3AF]">Время</p>
                      <p className="text-[14px] font-semibold text-[#111827]">
                        {row.dateLabel}, {row.timeLabel}
                      </p>
                    </div>
                    {priceLabel ? (
                      <p className="shrink-0 text-[16px] font-semibold tabular-nums text-[#111827]">{priceLabel}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={`mt-3 w-full ${homePinkBtn} text-[14px]`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goBook(slot);
                    }}
                  >
                    Записаться
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
