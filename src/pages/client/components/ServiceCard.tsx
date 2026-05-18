import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiChevronRight,
  HiClock,
  HiSparkles,
  HiUserGroup,
  HiWallet,
} from 'react-icons/hi2';
import { getServiceCategoryPath } from '../../../app/paths';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import {
  formatDurationMinutes,
  formatMastersNearbyLabel,
  formatPriceFrom,
  formatSlotCardSubline,
} from '../lib/catalogFormat';
import { getCatalogServicePhotoUrl } from '../../../features/catalog/catalogServicePhotos';
import { clientOutlineBtn } from '../clientTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  service: AggregatedServiceCard;
};

function StatRow({
  icon,
  label,
  value,
  valueClassName = 'text-[15px] font-semibold text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280]">
          {icon}
        </span>
        <span className="text-[14px] font-medium text-[#6B7280]">{label}</span>
      </div>
      <span className={`shrink-0 text-right leading-snug ${valueClassName}`}>{value}</span>
    </div>
  );
}

export function ServiceCard({ service }: Props) {
  const photo = getCatalogServicePhotoUrl(
    service.categoryCode || service.categoryName || service.title,
  );
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const hasSlot = Boolean(slotLine);
  const showPromo = Boolean(service.promoText);
  const showPopular = service.badge === 'popular' || service.badge === 'hit';

  return (
    <Link
      to={getServiceCategoryPath(service.categoryCode)}
      className="block w-full overflow-hidden rounded-[24px] bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)] ring-1 ring-[#f2f2f2] transition active:scale-[0.99]"
    >
      <div className="p-4">
        <div className="flex gap-3.5">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0">
            <ImageReveal
              src={photo}
              alt=""
              className="h-full w-full rounded-[20px] object-cover"
              loading="lazy"
            />
            {showPopular ? (
              <span className="absolute -left-0.5 -top-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#111827] shadow-sm ring-1 ring-[#F3F4F6]">
                🔥 Топ
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[20px] font-semibold leading-[1.15] tracking-tight text-[#111827]">
              {service.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-[#6B7280]">
              {service.subtitle}
            </p>
            {service.masterCount > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]">
                <HiUserGroup className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
                {formatMastersNearbyLabel(service.masterCount)}
              </p>
            ) : null}
          </div>

          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-[#F1EFEF] text-[#9CA3AF]"
            aria-hidden
          >
            <HiChevronRight className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 space-y-1 border-t border-[#F3F4F6] pt-3">
          <StatRow
            icon={<HiWallet className="h-[18px] w-[18px]" aria-hidden />}
            label="Цена"
            value={service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Уточните'}
          />
          <StatRow
            icon={<HiClock className="h-[18px] w-[18px]" aria-hidden />}
            label="Длительность"
            value={formatDurationMinutes(service.durationMinutes)}
          />
          <StatRow
            icon={<HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />}
            label="Окна"
            value={service.hasToday ? 'Сегодня' : hasSlot ? 'Есть' : 'Уточните'}
            valueClassName={
              service.hasToday || hasSlot
                ? 'text-[15px] font-semibold text-[#F47C8C]'
                : 'text-[15px] font-semibold text-[#111827]'
            }
          />
        </div>

        <div
          className={`mt-4 rounded-[18px] p-3.5 ${
            hasSlot ? 'bg-gradient-to-br from-[#FFF5F7] to-[#FFF1F4]' : 'bg-[#FAFAFA]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <HiSparkles
              className={`mt-0.5 h-5 w-5 shrink-0 ${hasSlot ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                Ближайшее окно
              </p>
              {hasSlot ? (
                <p className="mt-1 text-[15px] font-semibold leading-snug text-[#F47C8C]">{slotLine}</p>
              ) : (
                <p className="mt-1 text-[14px] font-medium leading-snug text-[#6B7280]">
                  Свободных окон пока нет
                </p>
              )}
            </div>
          </div>
          <span className={`${clientOutlineBtn} mt-3 w-full !min-h-11 !text-[14px]`}>
            {hasSlot ? 'Смотреть окно' : 'Открыть категорию'}
          </span>
        </div>
      </div>

      {showPromo ? (
        <div className="flex items-center gap-2 border-t border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3">
          <span className="text-[13px] font-semibold text-[#374151]">С акцией</span>
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[#6B7280]">
            {service.promoText}
          </span>
          <HiChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        </div>
      ) : null}
    </Link>
  );
}
