import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiChevronRight,
  HiClock,
  HiHeart,
  HiSparkles,
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

function InfoCell({
  icon,
  value,
  label,
  valueClassName = 'text-[15px] font-bold text-[#111827]',
  labelClassName = 'text-[#9CA3AF]',
}: {
  icon: ReactNode;
  value: string;
  label: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="flex items-center justify-center gap-1">
        <span className="text-[#9CA3AF]">{icon}</span>
        <span className={`leading-tight ${valueClassName}`}>{value}</span>
      </div>
      <p className={`mt-0.5 text-[11px] ${labelClassName}`}>{label}</p>
    </div>
  );
}

function StatDivider() {
  return <div className="mx-0.5 w-px self-stretch bg-[#F3F4F6]" aria-hidden />;
}

export function ServiceCard({ service }: Props) {
  const photo = getCatalogServicePhotoUrl(
    service.categoryCode || service.categoryName || service.title,
  );
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const hasSlot = Boolean(slotLine);
  const showPromo = Boolean(service.promoText);

  return (
    <Link
      to={getServiceCategoryPath(service.categoryCode)}
      className="block overflow-hidden rounded-[26px] bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)] ring-1 ring-[#f2f2f2] transition active:scale-[0.99]"
    >
      <div className="flex gap-3.5 p-3.5">
        <div className="relative w-[7.25rem] shrink-0">
          <ImageReveal
            src={photo}
            alt=""
            className="h-[8.75rem] w-full rounded-[20px] object-cover"
            loading="lazy"
          />
          {service.badge === 'popular' || service.badge === 'hit' ? (
            <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#111827] shadow-sm">
              🔥 Популярно
            </span>
          ) : null}
          {service.masterCount > 0 ? (
            <span className="absolute bottom-2 left-2 right-2 rounded-full bg-white/95 px-2 py-1 text-center text-[10px] font-semibold text-[#374151] shadow-sm">
              👥 {formatMastersNearbyLabel(service.masterCount)}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[18px] font-semibold leading-tight text-[#111827]">{service.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6B7280]">
                {service.subtitle}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#F47C8C]"
              aria-hidden
            >
              <HiHeart className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-3 flex items-start border-t border-[#F3F4F6] pt-2.5">
            <InfoCell
              icon={<HiWallet className="h-4 w-4" aria-hidden />}
              value={service.minPrice > 0 ? formatPriceFrom(service.minPrice) : '—'}
              label="цена"
            />
            <StatDivider />
            <InfoCell
              icon={<HiClock className="h-4 w-4" aria-hidden />}
              value={formatDurationMinutes(service.durationMinutes)}
              label="длительность"
            />
            <StatDivider />
            <InfoCell
              icon={<HiCalendarDays className="h-4 w-4" aria-hidden />}
              value={service.hasToday || hasSlot ? 'Есть окна' : 'Уточните'}
              label={service.hasToday ? 'сегодня' : hasSlot ? 'скоро' : 'время'}
              labelClassName={
                service.hasToday ? 'font-semibold text-[#F47C8C]' : 'text-[#9CA3AF]'
              }
            />
          </div>

          <div
            className={`mt-3 flex items-center gap-2 rounded-[16px] px-2.5 py-2 ${
              hasSlot ? 'bg-gradient-to-r from-[#FFF5F7] to-[#FFEEF2]' : 'bg-[#FAFAFA]'
            }`}
          >
            <HiSparkles className="h-5 w-5 shrink-0 text-[#F47C8C]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Ближайшее окно
              </p>
              {hasSlot ? (
                <p className="text-[13px] font-semibold lowercase text-[#F47C8C]">{slotLine}</p>
              ) : (
                <p className="text-[12px] font-medium text-[#6B7280]">Свободных окон пока нет</p>
              )}
            </div>
            <span
              className={`${clientOutlineBtn} shrink-0 !min-h-9 !bg-white !px-3 !text-[12px] !font-semibold !text-[#F47C8C] !shadow-sm`}
            >
              Смотреть окно
            </span>
          </div>
        </div>
      </div>

      {showPromo ? (
        <div className="flex items-center gap-2 border-t border-[#FFF1F4] bg-[#FFFBFC] px-4 py-3">
          <span className="text-[13px] font-semibold text-[#F47C8C]">🏷 С акцией</span>
          <span className="min-w-0 flex-1 text-[13px] font-medium text-[#F47C8C]">{service.promoText}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      ) : null}
    </Link>
  );
}
