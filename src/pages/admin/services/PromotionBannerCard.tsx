import { HiCalendarDays, HiEllipsisHorizontal } from 'react-icons/hi2';
import { adminIntroOverlayClass } from '../adminIntroOverlay';
import { promotionStatusLabel } from './servicesFormat';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';

function formatDdMmRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function statusBadgeClass(status: ServicePromotionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-[#ECFDF5]/95 text-[#16A34A]';
    case 'scheduled':
      return 'bg-[#EFF6FF]/95 text-[#2563EB]';
    case 'finished':
      return 'bg-white/80 text-[#6B7280]';
    default:
      return 'bg-white/90 text-[#6B7280]';
  }
}

export type PromotionCardModel = ServicePromotion & {
  status: ServicePromotionStatus;
};

type Props = {
  promo: PromotionCardModel;
  onMenu?: () => void;
  className?: string;
};

export function PromotionBannerCard({ promo, onMenu, className = '' }: Props) {
  const muted = promo.status === 'finished';
  const draft = promo.status === 'draft';
  const bg = promo.backgroundImage?.trim() || '/photos/sale/11.webp';

  return (
    <article
      className={`relative overflow-hidden rounded-[24px] shadow-[0_12px_36px_rgba(17,24,39,0.10)] ${
        muted ? 'opacity-[0.72]' : ''
      } ${draft ? 'ring-1 ring-[#FDE8ED]' : ''} ${className}`}
    >
      <div className="relative min-h-[168px]">
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className={`absolute inset-0 ${adminIntroOverlayClass}`} aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#5a2840]/50 via-transparent to-transparent"
          aria-hidden
        />

        <div className="absolute left-4 top-4 z-20">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${statusBadgeClass(promo.status)}`}
          >
            {promotionStatusLabel(promo.status)}
          </span>
        </div>

        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#6B7280] shadow-[0_4px_14px_rgba(17,24,39,0.12)] transition active:scale-[0.96]"
            aria-label="Меню акции"
          >
            <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <div className="absolute bottom-4 right-4 z-10">
          <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white text-center text-[12px] font-bold leading-tight text-[#F47C8C] shadow-[0_8px_24px_rgba(0,0,0,0.2)] ring-2 ring-white/80">
            {promo.discountLabel}
          </span>
        </div>

        <div className="relative z-10 flex min-h-[168px] flex-col justify-end p-4 pr-[5.5rem] pt-12 pb-[5.25rem]">
          <h3 className="text-[17px] font-bold leading-snug tracking-[-0.03em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            {promo.title}
          </h3>
          {promo.serviceTitle ? (
            <p className="mt-1 truncate text-[13px] font-semibold text-[#FFE4EA] drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
              {promo.serviceTitle}
            </p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-white/92 drop-shadow-[0_1px_5px_rgba(0,0,0,0.4)]">
            {promo.description}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-white/88 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
