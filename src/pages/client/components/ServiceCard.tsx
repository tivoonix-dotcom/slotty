import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiChevronRight,
  HiClock,
  HiHeart,
  HiStar,
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

import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  catalogInnerDivider,
  catalogListCardClass,
  catalogMetaChipClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from '../servicesCatalog/servicesCatalogTheme';

type Props = {
  service: AggregatedServiceCard;
  /** stack — мобильная; grid — плитка; wide — десктоп-строка */
  layout?: 'stack' | 'grid' | 'wide';
  /** row — строка внутри общей белой панели (OKX); card — отдельная карточка */
  surface?: 'card' | 'row';
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

export function ServiceCard({ service, layout = 'stack', surface = 'card' }: Props) {
  const photo = getCatalogServicePhotoUrl(
    service.categoryCode || service.categoryName || service.title,
  );
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const hasSlot = Boolean(slotLine);
  const showPromo = Boolean(service.promoText);
  const showPopular = service.badge === 'popular' || service.badge === 'hit';
  const isGrid = layout === 'grid';
  const isWide = layout === 'wide';

  if (isWide && surface === 'row') {
    return (
      <Link
        to={getServiceCategoryPath(service.categoryCode)}
        className={`group ${catalogPanelRowClass} ${catalogPanelRowPad}`}
      >
        <div className="flex items-center gap-4 lg:gap-5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#EBEBEB] lg:h-14 lg:w-14">
            <ImageReveal src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#8E8E93]">{service.categoryName}</p>
            <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-[#111827] lg:text-[17px]">
              {service.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[13px] text-[#8E8E93] lg:hidden">{service.subtitle}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-0 lg:flex">
            <div className="min-w-[100px] border-l border-[#EEEEEE] px-5 first:border-l-0 first:pl-0">
              <p className="text-[13px] text-[#8E8E93]">Цена</p>
              <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#111827]">
                {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : '—'}
              </p>
            </div>
            <div className="min-w-[88px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Время</p>
              <p className="mt-0.5 text-[15px] font-bold text-[#111827]">
                {formatDurationMinutes(service.durationMinutes)}
              </p>
            </div>
            <div className="min-w-[120px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Окно</p>
              <p className={`mt-0.5 text-[15px] font-semibold ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}>
                {hasSlot ? slotLine : '—'}
              </p>
            </div>
          </div>

          <HiChevronRight
            className="h-5 w-5 shrink-0 text-[#C7C7CC] transition group-hover:text-[#111827]"
            aria-hidden
          />
        </div>
      </Link>
    );
  }

  if (isWide) {
    const badgeLabel =
      service.badge === 'hit'
        ? 'Топ выбор'
        : service.badge === 'popular'
          ? 'Популярно'
          : showPromo
            ? 'Акция'
            : null;
    const badgeClass =
      service.badge === 'hit'
        ? 'bg-[#F3E8FF] text-[#7C3AED]'
        : service.badge === 'popular'
          ? 'bg-[#FFF1F4] text-[#F47C8C]'
          : 'bg-[#F47C8C] text-white';

    return (
      <Link
        to={getServiceCategoryPath(service.categoryCode)}
        className={`group relative flex w-full ${catalogListCardClass} lg:min-h-[148px] lg:flex-row`}
      >
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#EBEBEB] lg:h-auto lg:w-[168px] lg:min-h-[148px]">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full min-h-[176px] w-full object-cover transition duration-300 group-hover:scale-[1.01] lg:min-h-[148px]"
            loading="lazy"
          />
          {badgeLabel ? (
            <span
              className={`absolute left-3 top-3 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col p-5 lg:min-h-[148px] lg:p-4 lg:pr-[184px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-[#8E8E93]">{service.categoryName}</p>
              <button
                type="button"
                aria-label="В избранное"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#9CA3AF] transition hover:bg-[#EBEBEB] hover:text-[#F47C8C]"
              >
                <HiHeart className="block h-[18px] w-[18px] translate-x-px" aria-hidden />
              </button>
            </div>
            <h3 className="mt-1 text-[18px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
              {service.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[#8E8E93] lg:hidden">{service.subtitle}</p>
            {service.tags.length > 0 ? (
              <div className="mt-2 hidden flex-wrap gap-1.5 lg:flex">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[8px] bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-[#374151]">
              {service.avgRating > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <HiStar className="h-4 w-4 text-[#F59E0B]" aria-hidden />
                  {service.avgRating.toFixed(1)}
                </span>
              ) : null}
              {service.masterCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <HiUserGroup className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
                  {formatMastersNearbyLabel(service.masterCount)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <HiClock className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
                {formatDurationMinutes(service.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#111827]">
                {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Цена по запросу'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {showPromo ? (
                <span className="rounded-[8px] bg-[#FFF1F4] px-2.5 py-1 text-[12px] font-semibold text-[#F47C8C]">
                  Акция {service.promoText ?? '-10%'}
                </span>
              ) : null}
              {hasSlot ? (
                <span className="rounded-[8px] bg-[#ECFDF5] px-2.5 py-1 text-[12px] font-semibold text-[#15803D]">
                  Бесплатная отмена
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex w-full flex-col items-stretch gap-2 lg:absolute lg:bottom-4 lg:right-4 lg:mt-0 lg:w-[168px]">
            <div className="w-full rounded-[10px] bg-[#F5F5F5] px-3 py-2">
              <p className="text-[11px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              <p
                className={`mt-0.5 text-[13px] font-semibold leading-snug ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}
              >
                {hasSlot ? slotLine : 'Уточните у мастера'}
              </p>
            </div>
            <span className={`${hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn} w-full !min-h-9 !text-[13px]`}>
              {hasSlot ? 'Смотреть мастеров' : 'Открыть категорию'}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (isGrid) {
    return (
      <Link
        to={getServiceCategoryPath(service.categoryCode)}
        className={`group flex h-full flex-col ${catalogListCardClass} hover:-translate-y-0.5`}
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden bg-[#FAFAFA]">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {showPopular ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#111827] shadow-sm">
              🔥 Топ
            </span>
          ) : null}
          {showPromo ? (
            <span className="absolute right-3 top-3 rounded-full bg-[#F47C8C] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              Акция
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-[18px] font-bold leading-snug tracking-[-0.03em] text-[#111827]">
            {service.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[14px] leading-snug text-[#6B7280]">
            {service.subtitle}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold">
            <span className={catalogMetaChipClass}>
              {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Цена по запросу'}
            </span>
            <span className={catalogMetaChipClass}>
              {formatDurationMinutes(service.durationMinutes)}
            </span>
          </div>

          <div className={`mt-4 rounded-[14px] px-3 py-2.5 ${hasSlot ? 'bg-[#F6F7FB]' : 'bg-[#F6F7FB]'}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">Ближайшее окно</p>
            <p
              className={`mt-1 text-[14px] font-semibold ${hasSlot ? 'text-[#F47C8C]' : 'text-[#6B7280]'}`}
            >
              {hasSlot ? slotLine : 'Уточните у мастера'}
            </p>
          </div>

          {service.masterCount > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]">
              <HiUserGroup className="h-4 w-4 shrink-0" aria-hidden />
              {formatMastersNearbyLabel(service.masterCount)}
            </p>
          ) : null}

          <span className={hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn}>
            {hasSlot ? 'Смотреть мастеров' : 'Открыть категорию'}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={getServiceCategoryPath(service.categoryCode)}
      className={`block w-full ${catalogListCardClass} active:scale-[0.99]`}
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
              <span className="absolute -left-0.5 -top-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#111827] shadow-sm">
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

        <div className={`mt-4 space-y-1 pt-3 ${catalogInnerDivider}`}>
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

        <div className="mt-4 rounded-[10px] bg-[#F5F5F5] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              {hasSlot ? (
                <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">{slotLine}</p>
              ) : (
                <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#8E8E93]">
                  Свободных окон пока нет
                </p>
              )}
            </div>
            <span className={hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn}>
              {hasSlot ? 'Смотреть окно' : 'Открыть категорию'}
            </span>
          </div>
        </div>
      </div>

      {showPromo ? (
        <div className={`flex items-center gap-2 bg-[#F6F7FB] px-4 py-3 ${catalogInnerDivider}`}>
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
