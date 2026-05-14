import type { FC } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingPath } from '../../app/paths';
import type { PublicSlotDto } from '../../features/booking/api/publicSlotsApi';
import { formatReviewsCountLabel } from '../../features/services/model/demoMasters';
import type { DemoQuickSlot } from '../../features/services/model/demoQuickSlots';
import { getDemoQuickSlots } from '../../features/services/model/demoQuickSlots';
import { setProfileRole } from '../../features/profile/lib/setProfileRole';

function mapPublicSlotsToQuick(slots: PublicSlotDto[], max: number): DemoQuickSlot[] {
  return slots.slice(0, max).map((s) => {
    const start = new Date(s.startsAt);
    const dateLabel = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const timeLabel = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return {
      id: s.id,
      masterId: s.masterId,
      serviceId: s.bookingServiceId,
      masterName: s.masterDisplayName,
      serviceTitle: s.serviceTitle,
      category: '',
      photoUrl: '',
      dateLabel,
      timeLabel,
      price: s.servicePrice,
      rating: 0,
      reviewsCount: 0,
      addressLabel: '',
      slotId: s.id,
    };
  });
}

function IconStarTiny({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

type Props = {
  category: string | null;
  /**
   * `undefined` — демо-окна.
   * Массив — с бэкенда (пустой = реально нет окон).
   * `loading` / `error` — режим API без демо.
   */
  apiSlots?: PublicSlotDto[] | 'loading' | 'error';
};

export const ServicesNearQuickSlots: FC<Props> = ({ category, apiSlots }) => {
  const navigate = useNavigate();
  const slots = useMemo(() => {
    if (apiSlots === 'loading' || apiSlots === 'error') return [];
    if (apiSlots !== undefined) {
      return mapPublicSlotsToQuick(apiSlots, 6);
    }
    return getDemoQuickSlots({ category, maxSlots: 6 });
  }, [apiSlots, category]);

  const backendStatus = apiSlots === 'loading' || apiSlots === 'error' ? apiSlots : null;

  if (backendStatus !== 'loading' && backendStatus !== 'error' && slots.length === 0) {
    return null;
  }

  const goBook = (masterId: string, serviceId: string, slotId: string) => {
    void setProfileRole('client');
    navigate(getBookingPath(masterId, serviceId, slotId, { from: 'services' }));
  };

  return (
    <section className="mt-6 w-full min-w-0 max-w-full animate-fade-enter" aria-labelledby="services-near-slots-heading">
      <div className="rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_18px_52px_rgba(17,17,17,0.05)]">
        <div className="rounded-[28px] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)] sm:px-5 sm:py-5">
          <h2 id="services-near-slots-heading" className="text-[20px] font-semibold tracking-[-0.05em] text-neutral-950">
            Ближайшие свободные окна
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
            {category ? `Категория: ${category}` : 'Все направления'}
          </p>
        </div>

        {backendStatus === 'loading' ? (
          <div className="mt-3 rounded-[28px] bg-white/90 px-4 py-6 text-center shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-[15px] font-medium text-neutral-600">Загрузка…</p>
          </div>
        ) : backendStatus === 'error' ? (
          <div className="mt-3 rounded-[28px] bg-white/90 px-4 py-6 text-center shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-[15px] font-semibold text-neutral-600">Не удалось загрузить ближайшие окна</p>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-neutral-500">
              Проверьте соединение с сервером или откройте раздел позже.
            </p>
          </div>
        ) : (
          <div className="-mx-0.5 mt-3 flex gap-2.5 overflow-x-auto pb-1 pl-0.5 pr-0.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {slots.map((slot) => (
              <article
                key={slot.id}
                className="w-[min(15.5rem,72vw)] shrink-0 rounded-[26px] bg-white p-3 shadow-[0_10px_28px_rgba(17,17,17,0.035)]"
              >
                <p className="truncate text-[15px] font-semibold tracking-[-0.04em] text-neutral-950">{slot.serviceTitle}</p>
                <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-500">{slot.masterName}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-neutral-800">
                    {slot.dateLabel} · {slot.timeLabel}
                  </p>
                  <p className="shrink-0 text-[14px] font-semibold tabular-nums text-neutral-950">{slot.price} BYN</p>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                  <IconStarTiny className="text-[#E29595]" />
                  <span>
                    {slot.rating.toFixed(1)} · {formatReviewsCountLabel(slot.reviewsCount)}
                  </span>
                </p>
                <button
                  type="button"
                  className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#E29595] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.2)] transition active:scale-[0.98]"
                  onClick={() => goBook(slot.masterId, slot.serviceId, slot.slotId)}
                >
                  Записаться
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
