import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingPath, SERVICES_PATH } from '../app/paths';
import { fetchPublicSlots, type PublicSlotDto } from '../features/booking/api/publicSlotsApi';
import { getLocalTodayIsoRange } from '../features/landing/homeLandingBounds';
import { defaultMasterAvatarUrl } from '../features/master/model/masterDraftStorage';
import type { MasterLocation } from '../features/profile/model/masterLocation';
import { formatPublicAddress } from '../features/profile/model/masterLocation';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { fetchPublishedMasters, type PublishedMasterDto } from '../features/services/api/publishedMastersApi';
import { optimizeAvatarUrl } from '../shared/lib/optimizeAvatarUrl';
import { formatReviewsCountLabel } from '../features/services/model/demoMasters';
import { getApiBaseUrl } from '../shared/api/backendClient';
import { ImageReveal } from '../shared/ui/ImageReveal';
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
  photoUrl: string;
  addressLabel: string;
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

    let addressLabel = '';
    let photoUrl = '';
    let rating = 0;
    let reviewsCount = 0;

    if (m) {
      if (m.location) {
        const loc: MasterLocation = {
          visitType: 'studio',
          city: m.location.city?.trim() || undefined,
          street: (m.location.publicAddress || '').trim() || '—',
          building: '',
        };
        addressLabel = formatPublicAddress(loc);
      }
      const name = m.displayName.trim() || 'Мастер';
      photoUrl = optimizeAvatarUrl((m.photoUrl && m.photoUrl.trim()) || defaultMasterAvatarUrl(name), 220);
      rating = m.rating;
      reviewsCount = m.reviewsCount;
    } else {
      const name = slot.masterDisplayName.trim() || 'Мастер';
      photoUrl = optimizeAvatarUrl(defaultMasterAvatarUrl(name), 220);
    }

    return {
      key: slot.id,
      slot,
      photoUrl,
      addressLabel,
      rating,
      reviewsCount,
      dateLabel,
      timeLabel,
    };
  });
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

  return (
    <section
      className={`${homeSection} w-full min-w-0 max-w-full`}
      style={{ animationDelay: '80ms' }}
      aria-labelledby="home-quick-slots-heading"
    >
      <div className="mb-4 px-0.5">
        <h2 id="home-quick-slots-heading" className={homeSectionTitle}>
          Свободные окна сегодня
        </h2>
        <p className={homeSectionSubtitle}>Быстро запишитесь к мастеру на ближайшее время.</p>
      </div>

        {!hasApi ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-8">
            <p className="text-[17px] font-semibold text-neutral-700">Каталог недоступен без API</p>
            <p className="mx-auto mt-2 max-w-[22rem] text-[14px] leading-relaxed text-neutral-500">
              Укажите <span className="font-mono text-[13px]">VITE_API_URL</span> для фронта — тогда здесь появятся реальные окна из базы.
            </p>
          </div>
        ) : isLoading ? (
          <div className="mt-4 flex min-h-[16rem] items-center justify-center rounded-[32px] bg-white/90 px-4 py-10 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
            <LoadingVideo size="lg" label="Загрузка окон…" />
          </div>
        ) : isError ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-8">
            <p className="text-[17px] font-semibold text-neutral-700">Не удалось загрузить окна</p>
            <p className="mx-auto mt-2 max-w-[22rem] text-[14px] leading-relaxed text-neutral-500">
              Проверьте соединение или откройте каталог услуг.
            </p>
            <Link
              to={SERVICES_PATH}
              className={`mt-5 ${homePinkBtn} px-6 text-[15px]`}
            >
              К услугам
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-8">
            <p className="text-[17px] font-semibold text-neutral-700">Свободных окон пока нет</p>
            <p className="mx-auto mt-2 max-w-[22rem] text-[14px] leading-relaxed text-neutral-500">
              Попробуйте открыть каталог услуг или зайти позже.
            </p>
            <Link
              to={SERVICES_PATH}
              className={`mt-5 ${homePinkBtn} px-6 text-[15px]`}
            >
              К услугам
            </Link>
          </div>
        ) : (
          <div className={homeScrollRow}>
            {rows.map((row, index) => {
              const slot = row.slot;
              const eager = index < 6;
              return (
                <article
                  key={row.key}
                  role="button"
                  tabIndex={0}
                  className={`w-[min(17.5rem,78vw)] shrink-0 cursor-pointer p-1 outline-none transition active:scale-[0.99] sm:w-72 ${homeCard}`}
                  style={{ animationDelay: `${100 + index * 45}ms` }}
                  onClick={() => goBook(slot)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goBook(slot);
                    }
                  }}
                  aria-label={`Запись: ${slot.serviceTitle} у ${slot.masterDisplayName}`}
                >
                  <div className="p-3">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] bg-[#F1EFEF]">
                        <ImageReveal
                          src={row.photoUrl}
                          alt=""
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          loading={eager ? 'eager' : 'lazy'}
                          fetchPriority={eager ? 'high' : 'low'}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                          {slot.masterDisplayName}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-500">{slot.serviceTitle}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                            <IconStar className="text-[#F47C8C]" />
                            {row.rating.toFixed(1)}
                          </span>
                          <span className="text-[12px] font-medium text-neutral-400">
                            {formatReviewsCountLabel(row.reviewsCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-[13px] font-medium leading-snug text-neutral-500 line-clamp-2">
                      {row.addressLabel || 'Адрес в профиле мастера'}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F1EFEF] pt-3">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Время</p>
                        <p className="mt-0.5 text-[15px] font-semibold text-neutral-950">
                          {row.dateLabel} · {row.timeLabel}
                        </p>
                      </div>
                      <p className="shrink-0 text-[17px] font-semibold tabular-nums text-neutral-950">{slot.servicePrice} BYN</p>
                    </div>

                    <button
                      type="button"
                      className={`mt-4 w-full ${homePinkBtn} text-[15px]`}
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
