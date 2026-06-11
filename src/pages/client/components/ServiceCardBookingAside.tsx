import { HiCalendarDays } from 'react-icons/hi2';
import { EMPTY_PRICE } from '../../../shared/lib/emptyDisplayText';
import { resolveServiceCardCtaLabel } from '../lib/serviceCardPresentation';
import {
  catalogBookingAsideClass,
  catalogBookingAsideLabelClass,
  catalogBookingAsideSlotActiveClass,
  catalogBookingAsideSlotClass,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from '../servicesCatalog/servicesCatalogTheme';

type Props = {
  priceLabel: string;
  hasSlot: boolean;
  slotLine: string | null;
};

export function ServiceCardBookingAside({
  priceLabel,
  hasSlot,
  slotLine,
}: Props) {
  const resolvedPrice = priceLabel || EMPTY_PRICE;
  const ctaLabel = resolveServiceCardCtaLabel(hasSlot);
  const slotShellClass = hasSlot ? catalogBookingAsideSlotActiveClass : catalogBookingAsideSlotClass;

  return (
    <div className={catalogBookingAsideClass}>
      <div className="flex flex-col justify-center gap-3">
        <div>
          <p className={catalogBookingAsideLabelClass}>Стоимость</p>
          <p className="mt-1.5 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#F47C8C] tabular-nums lg:text-[24px]">
            {resolvedPrice}
          </p>
        </div>

        <div className={slotShellClass}>
          <p className={catalogBookingAsideLabelClass}>Ближайшее окно</p>
          <p
            className={`mt-1 text-[14px] font-bold leading-snug tracking-[-0.01em] ${
              hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'
            }`}
          >
            {hasSlot && slotLine ? slotLine : 'Нет свободных окон'}
          </p>
        </div>

        <span
          className={`${
            hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn
          } w-full !min-h-11 !rounded-[14px] !text-[14px] !font-bold`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {hasSlot ? (
              <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            ) : null}
            {ctaLabel}
          </span>
        </span>

        <p className="text-center text-[11px] font-medium leading-relaxed text-[#8E8E93]">
          <span>Бесплатная отмена</span>
          <span className="mx-1.5 text-[#D1D5DB]" aria-hidden>
            ·
          </span>
          <span>Оплата у мастера</span>
        </p>
      </div>
    </div>
  );
}
