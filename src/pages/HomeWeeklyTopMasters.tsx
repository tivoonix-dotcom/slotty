import type { FC } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingPath, getMasterPath } from '../app/paths';
import { formatReviewsCountLabel } from '../features/services/model/demoMasters';
import { getWeeklyTopDemoMasters } from '../features/services/model/demoQuickSlots';
import { setProfileRole } from '../features/profile/lib/setProfileRole';

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

export const HomeWeeklyTopMasters: FC = () => {
  const navigate = useNavigate();
  const masters = useMemo(() => getWeeklyTopDemoMasters(5), []);

  const goProfile = (masterId: string) => {
    void setProfileRole('client');
    navigate(getMasterPath(masterId));
  };

  const goBook = (masterId: string, serviceId: string | undefined) => {
    void setProfileRole('client');
    navigate(getBookingPath(masterId, serviceId ?? null, null));
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

        <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-1 pl-1 pr-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {masters.map((m, index) => {
            const firstServiceId = m.services[0]?.id;
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
                aria-label={`Профиль мастера ${m.masterName}`}
              >
                <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
                  <div className="flex gap-3">
                    <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[22px] bg-[#F1EFEF]">
                      <img src={m.photoUrl} alt="" width={72} height={72} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">{m.masterName}</p>
                      <p className="mt-0.5 text-[13px] font-medium text-neutral-500">{m.category}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                          <IconStar className="text-[#E29595]" />
                          {m.rating.toFixed(1)}
                        </span>
                        <span className="text-[12px] font-medium text-neutral-400">{formatReviewsCountLabel(m.reviewsCount)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] font-medium text-neutral-500">{m.services.length} услуг в каталоге</p>

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
                        goBook(m.masterId, firstServiceId);
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
      </div>
    </section>
  );
};
