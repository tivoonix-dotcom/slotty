import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getBookingPath, getMasterPath } from '../app/paths';
import { defaultMasterAvatarUrl } from '../features/master/model/masterDraftStorage';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { fetchPublishedMasters, type PublishedMasterDto } from '../features/services/api/publishedMastersApi';
import { formatReviewsCountLabel } from '../features/services/model/demoMasters';
import { getApiBaseUrl } from '../shared/api/backendClient';

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

function weeklyTopScore(m: PublishedMasterDto): number {
  return m.rating * 20 + m.reviewsCount * 0.2 + (m.primaryServiceId ? 2 : 0);
}

export const HomeWeeklyTopMasters: FC = () => {
  const navigate = useNavigate();
  const hasApi = Boolean(getApiBaseUrl());

  const { data: masters = [], isLoading, isError } = useQuery({
    queryKey: ['home-weekly-top-masters'],
    enabled: hasApi,
    queryFn: async () => {
      const rows = await fetchPublishedMasters({ limit: 48 });
      return [...rows].sort((a, b) => weeklyTopScore(b) - weeklyTopScore(a)).slice(0, 5);
    },
  });

  const goProfile = (masterId: string) => {
    void setProfileRole('client');
    navigate(getMasterPath(masterId));
  };

  const goBook = (m: PublishedMasterDto) => {
    void setProfileRole('client');
    navigate(getBookingPath(m.masterId, m.primaryServiceId ?? null, null));
  };

  return (
    <section
      className="mt-12 w-full min-w-0 max-w-full animate-fade-enter scroll-mt-28 sm:mt-16"
      style={{ animationDelay: '110ms' }}
      aria-labelledby="weekly-top-heading"
    >
      <div className="rounded-[38px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.05)] sm:rounded-[44px]">
        <div className="overflow-hidden rounded-[32px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:rounded-[38px] sm:px-7 sm:py-8">
          <div className="max-w-[28rem]">
            <h2
              id="weekly-top-heading"
              className="text-[clamp(1.75rem,4.8vw,2.35rem)] font-semibold leading-[1.06] tracking-[-0.06em] text-neutral-950"
            >
              Топ мастеров недели
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">
              Мастера с высоким рейтингом, отзывами и активными услугами.
            </p>
          </div>
        </div>

        {!hasApi ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
            <p className="text-[15px] font-semibold text-neutral-600">Подключите API, чтобы увидеть мастеров из каталога.</p>
          </div>
        ) : isLoading ? (
          <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-1 pl-1 pr-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[min(17.5rem,78vw)] shrink-0 animate-pulse rounded-[32px] bg-[#F1EFEF] p-3 sm:w-72">
                <div className="h-[12.5rem] rounded-[28px] bg-white/80" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
            <p className="text-[15px] font-semibold text-neutral-600">Не удалось загрузить топ мастеров</p>
          </div>
        ) : masters.length === 0 ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
            <p className="text-[15px] font-semibold text-neutral-600">Пока нет опубликованных мастеров</p>
          </div>
        ) : (
          <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-1 pl-1 pr-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {masters.map((m, index) => {
              const name = m.displayName.trim() || 'Мастер';
              const photoUrl = (m.photoUrl && m.photoUrl.trim()) || defaultMasterAvatarUrl(name);
              const category = m.category?.name?.trim() || m.category?.code || 'Мастер';
              const eager = index < 3;
              return (
                <article
                  key={m.masterId}
                  role="button"
                  tabIndex={0}
                  className="w-[min(17.5rem,78vw)] shrink-0 cursor-pointer rounded-[32px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)] outline-none transition active:scale-[0.99] sm:w-72"
                  style={{ animationDelay: `${120 + index * 45}ms` }}
                  onClick={() => goProfile(m.masterId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goProfile(m.masterId);
                    }
                  }}
                  aria-label={`Профиль мастера ${name}`}
                >
                  <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
                    <div className="flex gap-3">
                      <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[22px] bg-[#F1EFEF]">
                        <img
                          src={photoUrl}
                          alt=""
                          width={72}
                          height={72}
                          className="h-full w-full object-cover"
                          loading={eager ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={eager ? 'high' : 'low'}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">{name}</p>
                        <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-500">{category}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                            <IconStar className="text-[#E29595]" />
                            {m.rating.toFixed(1)}
                          </span>
                          <span className="text-[12px] font-medium text-neutral-400">
                            {formatReviewsCountLabel(m.reviewsCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-[13px] font-medium text-neutral-500 line-clamp-2">
                      {(m.primaryServiceName && m.primaryServiceName.trim()) || 'Услуги в каталоге'}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
                        onClick={(e) => {
                          e.stopPropagation();
                          goProfile(m.masterId);
                        }}
                      >
                        Профиль
                      </button>
                      <button
                        type="button"
                        className="flex min-h-11 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
                        onClick={(e) => {
                          e.stopPropagation();
                          goBook(m);
                        }}
                      >
                        Записаться
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
