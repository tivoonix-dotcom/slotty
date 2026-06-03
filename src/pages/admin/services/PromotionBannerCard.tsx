import { HiCalendarDays, HiEllipsisHorizontal, HiReceiptPercent } from 'react-icons/hi2';
import { cabinetIconCircle } from '../profile/adminProfileCabinetTheme';
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
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'scheduled':
      return 'bg-[#EFF6FF] text-[#2563EB]';
    case 'finished':
      return 'bg-[#EBEBEB] text-[#6B7280]';
    default:
      return 'bg-[#FFF4E8] text-[#B45309]';
  }
}

export type PromotionCardModel = ServicePromotion & {
  status: ServicePromotionStatus;
};

type Props = {
  promo: PromotionCardModel;
  onMenu?: () => void;
  className?: string;
  examplePreview?: boolean;
};

export function PromotionBannerCard({ promo, onMenu, className = '', examplePreview = false }: Props) {
  const muted = promo.status === 'finished';
  const bg = promo.backgroundImage?.trim();

  return (
    <article
      className={`flex w-full overflow-hidden rounded-[16px] bg-white lg:rounded-[24px] lg:border lg:border-[#EAECEF] lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)] ${
        muted && !examplePreview ? 'opacity-75' : ''
      } ${examplePreview ? 'ring-2 ring-dashed ring-[#D1D5DB]' : ''} ${className}`}
    >
      <div className="relative flex w-[6.25rem] shrink-0 self-stretch bg-[#EBEBEB] sm:w-28 lg:w-[7rem]">
        {bg ? (
          <>
            <img
              src={bg}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${examplePreview ? 'opacity-60 saturate-50' : ''}`}
              loading="lazy"
            />
            <div
              className={`absolute inset-0 ${examplePreview ? 'bg-[#111827]/35' : 'bg-[#111827]/20'}`}
              aria-hidden
            />
            {examplePreview ? (
              <span className="absolute inset-x-0 top-2 z-10 text-center text-[9px] font-black uppercase tracking-wider text-white drop-shadow">
                Пример
              </span>
            ) : null}
          </>
        ) : (
          <span className="flex h-full min-h-[7.5rem] w-full items-center justify-center">
            <span className={`${cabinetIconCircle} h-12 w-12 rounded-[12px]`}>
              <HiReceiptPercent className="h-6 w-6" aria-hidden />
            </span>
          </span>
        )}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-0.5 p-2">
          <span
            className={`flex min-h-[3.5rem] min-w-[3.5rem] items-center justify-center rounded-full bg-white px-2 text-center text-[11px] font-bold leading-tight text-[#F47C8C] shadow-[0_4px_14px_rgba(17,24,39,0.08)] ${
              examplePreview ? 'ring-2 ring-dashed ring-[#D1D5DB]' : ''
            }`}
          >
            {promo.discountLabel}
          </span>
          {examplePreview ? (
            <span className="text-[8px] font-bold uppercase tracking-wide text-white/90">иллюстрация</span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 lg:justify-center lg:px-5 lg:py-4">
        <div className="flex items-start justify-between gap-2">
          {examplePreview ? (
            <span className="inline-flex rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#92400E] ring-1 ring-[#FDE68A]">
              Только пример
            </span>
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadgeClass(promo.status)}`}
            >
              {promotionStatusLabel(promo.status)}
            </span>
          )}
          {onMenu ? (
            <button
              type="button"
              onClick={onMenu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition active:scale-[0.96]"
              aria-label="Меню акции"
            >
              <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>

        <h3 className="mt-1.5 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827] lg:text-[20px]">
          {promo.title}
        </h3>

        {promo.serviceTitle ? (
          <p className="mt-1 truncate text-[13px] font-medium text-[#6B7280]">{promo.serviceTitle}</p>
        ) : null}

        {promo.description ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-[#9CA3AF]">
            {promo.description}
          </p>
        ) : null}

        {examplePreview ? (
          <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">
            Сроки и условия задаёте при создании своей акции в Pro
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#9CA3AF]">
            <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
          </p>
        )}
      </div>
    </article>
  );
}
