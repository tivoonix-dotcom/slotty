import type { FC } from 'react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingPath, SERVICES_PATH } from '../app/paths';
import { formatReviewsCountLabel } from '../features/services/model/demoMasters';
import { getDemoQuickSlots } from '../features/services/model/demoQuickSlots';
import { setProfileRole } from '../features/profile/lib/setProfileRole';

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

export const HomeQuickSlots: FC = () => {
  const navigate = useNavigate();
  const slots = useMemo(() => getDemoQuickSlots({ maxSlots: 8 }), []);

  const goBook = (masterId: string, serviceId: string, slotId: string) => {
    void setProfileRole('client');
    navigate(getBookingPath(masterId, serviceId, slotId));
  };

  return (
    <section
      className="mt-12 w-full min-w-0 max-w-full animate-fade-enter scroll-mt-28 sm:mt-16"
      style={{ animationDelay: '80ms' }}
      aria-labelledby="home-quick-slots-heading"
    >
      <div className="rounded-[38px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.05)] sm:rounded-[44px]">
        <div className="overflow-hidden rounded-[32px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:rounded-[38px] sm:px-7 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[26rem]">
              <h2
                id="home-quick-slots-heading"
                className="text-[clamp(1.75rem,4.8vw,2.35rem)] font-semibold leading-[1.06] tracking-[-0.06em] text-neutral-950"
              >
                Свободные окна сегодня
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">
                Быстро запишитесь к мастеру на ближайшее время.
              </p>
            </div>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="mt-4 rounded-[32px] bg-white/90 px-5 py-8 text-center shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-8">
            <p className="text-[17px] font-semibold text-neutral-700">Свободных окон пока нет</p>
            <p className="mx-auto mt-2 max-w-[22rem] text-[14px] leading-relaxed text-neutral-500">
              Попробуйте выбрать другую категорию или открыть список мастеров.
            </p>
            <Link
              to={SERVICES_PATH}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#E29595] px-6 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
            >
              К услугам
            </Link>
          </div>
        ) : (
          <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-1 pl-1 pr-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {slots.map((slot, index) => (
              <article
                key={slot.id}
                role="button"
                tabIndex={0}
                className="w-[min(17.5rem,78vw)] shrink-0 cursor-pointer rounded-[32px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)] outline-none transition active:scale-[0.99] sm:w-72"
                style={{ animationDelay: `${100 + index * 45}ms` }}
                onClick={() => goBook(slot.masterId, slot.serviceId, slot.slotId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goBook(slot.masterId, slot.serviceId, slot.slotId);
                  }
                }}
                aria-label={`Запись: ${slot.serviceTitle} у ${slot.masterName}`}
              >
                <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] bg-[#F1EFEF]">
                      <img
                        src={slot.photoUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">{slot.masterName}</p>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-500">{slot.serviceTitle}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-2 py-0.5 text-[12px] font-semibold text-neutral-700">
                          <IconStar className="text-[#E29595]" />
                          {slot.rating.toFixed(1)}
                        </span>
                        <span className="text-[12px] font-medium text-neutral-400">{formatReviewsCountLabel(slot.reviewsCount)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] font-medium leading-snug text-neutral-500 line-clamp-2">{slot.addressLabel}</p>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F1EFEF] pt-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Время</p>
                      <p className="mt-0.5 text-[15px] font-semibold text-neutral-950">
                        {slot.dateLabel} · {slot.timeLabel}
                      </p>
                    </div>
                    <p className="shrink-0 text-[17px] font-semibold tabular-nums text-neutral-950">{slot.price} BYN</p>
                  </div>

                  <button
                    type="button"
                    className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
                    onClick={(e) => {
                      e.stopPropagation();
                      goBook(slot.masterId, slot.serviceId, slot.slotId);
                    }}
                  >
                    Записаться
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
