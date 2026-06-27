import type { MouseEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiBars3, HiCalendarDays, HiChevronRight, HiEllipsisHorizontal } from 'react-icons/hi2';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_ATTENTION_EXCLAMATION_ICON_SRC } from '../shared/AdminSectionAttentionBadge';
import { adminScheduleAddWindowUrl } from '../schedule/scheduleDeepLinks';
import {
  servicesCatalogBadgeHidden,
  servicesCatalogBadgeVisible,
  servicesCatalogCardBody,
  servicesCatalogCardGridNoSlotsShell,
  servicesCatalogCardGridShell,
  servicesCatalogCardNoSlotsShell,
  servicesCatalogCardShell,
  servicesCatalogCardThumbCol,
  servicesCatalogDragHandle,
  servicesCatalogMenuBtn,
  servicesCatalogMetaMuted,
  servicesCatalogPriceText,
  servicesCatalogSlotsLink,
} from './adminServicesTheme';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice } from './servicesFormat';

type Props = {
  service: ManagedService;
  imageSrc: string | null;
  categoryLabel?: string | null;
  availableSlotsCount?: number;
  upcomingAppointmentsCount?: number;
  /** false — пока слоты с API ещё не загружены (не показывать «нет окон»). */
  slotsStatsReady?: boolean;
  layout?: 'list' | 'grid';
  onOpenMenu?: (service: ManagedService) => void;
  onEdit?: (service: ManagedService) => void;
  highlighted?: boolean;
  showMenu?: boolean;
  showDragHandle?: boolean;
  isDragSource?: boolean;
  isDragOver?: boolean;
  onDragHandlePointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  /** Клик по карточке (например, превью в профиле → каталог услуг). */
  onCardClick?: () => void;
};

function formatSlotsLabel(count: number): string {
  if (count <= 0) return 'Нет слотов в расписании';
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'окон';
  if (mod10 === 1 && mod100 !== 11) word = 'окно';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'окна';
  return `${count} ${word}`;
}

function formatUpcomingLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'будущих записей';
  if (mod10 === 1 && mod100 !== 11) word = 'будущая запись';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'будущие записи';
  return `${count} ${word}`;
}

function ServiceNoSlotsNotice({ serviceId, serviceTitle }: { serviceId: string; serviceTitle: string }) {
  const scheduleUrl = adminScheduleAddWindowUrl(serviceId);

  return (
    <div
      className="mx-3.5 mb-3.5 mt-1 rounded-[12px] bg-[#FFF1F4] px-3.5 py-3 sm:mx-4 sm:mb-4 sm:px-4"
      role="note"
      aria-label={`У услуги «${serviceTitle}» нет времени для записи`}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
            <SlottyImg
              src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
              alt=""
              className="h-6 w-6 object-contain"
              decoding="async"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-[#111827]">Нет времени для записи</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">
              Клиенты видят её в каталоге, но не могут выбрать дату и время.
            </p>
          </div>
        </div>

        <Link
          to={scheduleUrl}
          className="inline-flex min-h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#F47C8C] bg-white px-3.5 text-[12px] font-semibold leading-none text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.98] sm:w-auto"
        >
          <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          <span>Добавить в расписание</span>
        </Link>
      </div>
    </div>
  );
}

function visibilityBadgeClass(visible: boolean): string {
  return visible ? servicesCatalogBadgeVisible : servicesCatalogBadgeHidden;
}

function ServiceScheduleMeta({
  serviceId,
  visible,
  availableSlotsCount,
  upcomingAppointmentsCount,
  slotsStatsReady = true,
}: {
  serviceId: string;
  visible: boolean;
  availableSlotsCount?: number;
  upcomingAppointmentsCount: number;
  slotsStatsReady?: boolean;
}) {
  if (!visible) return null;

  const scheduleUrl = adminScheduleAddWindowUrl(serviceId);
  const upcomingLabel =
    upcomingAppointmentsCount > 0 ? formatUpcomingLabel(upcomingAppointmentsCount) : null;

  if (!slotsStatsReady || availableSlotsCount == null) {
    return null;
  }

  if (availableSlotsCount > 0) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          to={scheduleUrl}
          className={servicesCatalogSlotsLink}
          aria-label={`${formatSlotsLabel(availableSlotsCount)} — открыть создание расписания для услуги`}
        >
          <span>{formatSlotsLabel(availableSlotsCount)}</span>
          <HiChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        </Link>
        {upcomingLabel ? (
          <span className={`text-[12px] ${servicesCatalogMetaMuted}`}>{upcomingLabel}</span>
        ) : null}
      </div>
    );
  }

  if (upcomingLabel) {
    return <p className={`mt-1 text-[12px] ${servicesCatalogMetaMuted}`}>{upcomingLabel}</p>;
  }

  return null;
}

/** Карточка услуги в каталоге кабинета (мобилка + десктоп). */
export function CatalogServiceCard({
  service,
  imageSrc,
  categoryLabel,
  availableSlotsCount,
  upcomingAppointmentsCount = 0,
  slotsStatsReady = true,
  layout = 'list',
  onOpenMenu,
  onEdit,
  highlighted = false,
  showMenu = true,
  showDragHandle = false,
  isDragSource = false,
  isDragOver = false,
  onDragHandlePointerDown,
  onCardClick,
}: Props) {
  const visible = service.isActive !== false;
  const subtitle = categoryLabel?.trim() || null;
  const showNoSlotsNotice =
    visible &&
    slotsStatsReady &&
    availableSlotsCount != null &&
    availableSlotsCount <= 0 &&
    !onCardClick;
  const listShell = showNoSlotsNotice ? servicesCatalogCardNoSlotsShell : servicesCatalogCardShell;
  const gridShell = showNoSlotsNotice
    ? servicesCatalogCardGridNoSlotsShell
    : servicesCatalogCardGridShell;
  const shellClass =
    layout === 'grid'
      ? highlighted
        ? `${gridShell} ring-2 ring-[#F47C8C]/35 ring-offset-2 ring-offset-[#F5F5F5]`
        : gridShell
      : highlighted
        ? `${listShell} ring-2 ring-[#F47C8C]/35 ring-offset-2 ring-offset-white`
        : listShell;

  const dragStateClass = isDragSource
    ? 'pointer-events-none opacity-60'
    : isDragOver
      ? 'ring-2 ring-[#F47C8C]/45 ring-offset-2 ring-offset-[#F5F5F5]'
      : '';

  const isInteractive = Boolean(onCardClick || onEdit);
  const gridClass =
    layout === 'grid'
      ? 'flex h-full flex-col transition hover:border-[#E4E4E7] hover:shadow-[0_4px_18px_rgba(17,24,39,0.08)]'
      : '';

  const handleCardActivate = () => {
    if (onCardClick) {
      onCardClick();
      return;
    }
    onEdit?.(service);
  };

  const handleCardClick = (event: MouseEvent<HTMLLIElement>) => {
    if (!isInteractive) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button')) return;
    handleCardActivate();
  };

  return (
    <li
      data-catalog-service-id={service.id}
      className={`${shellClass} ${dragStateClass} ${gridClass} ${
        isInteractive ? 'cursor-pointer transition hover:opacity-95 active:scale-[0.995]' : ''
      }`.trim()}
      onClick={handleCardClick}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCardActivate();
              }
            }
          : undefined
      }
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={
        onCardClick
          ? `Открыть раздел «Услуги»: ${service.title}`
          : onEdit
            ? `Редактировать услугу: ${service.title}`
            : undefined
      }
    >
      <div className={`${servicesCatalogCardBody} ${layout === 'grid' ? 'min-h-0 flex-1' : ''}`}>
        {showDragHandle ? (
          <button
            type="button"
            className={servicesCatalogDragHandle}
            aria-label={`Переместить «${service.title}»`}
            onPointerDown={onDragHandlePointerDown}
          >
            <HiBars3 className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <div className={servicesCatalogCardThumbCol}>
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              edge="flush-left"
              sizeClass="block h-full min-h-[5.5rem] w-full"
            />
          ) : (
            <ServiceThumbnailFallback
              edge="flush-left"
              sizeClass="flex h-full min-h-[5.5rem] w-full items-center justify-center"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-3.5 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:text-[16px]">
              {service.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              <span className={visibilityBadgeClass(visible)}>
                {visible ? 'Видимая' : 'Скрытая'}
              </span>
              {showMenu && onOpenMenu ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenMenu(service);
                  }}
                  className={servicesCatalogMenuBtn}
                  aria-label={`Меню: ${service.title}`}
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          {subtitle ? (
            <p className={`mt-0.5 line-clamp-1 ${servicesCatalogMetaMuted}`}>{subtitle}</p>
          ) : null}

          <p className={servicesCatalogPriceText}>{formatServicePrice(service)}</p>

          {onCardClick || showNoSlotsNotice ? null : (
            <ServiceScheduleMeta
              serviceId={service.id}
              visible={visible}
              availableSlotsCount={availableSlotsCount}
              upcomingAppointmentsCount={upcomingAppointmentsCount}
              slotsStatsReady={slotsStatsReady}
            />
          )}
        </div>
      </div>

      {showNoSlotsNotice ? (
        <div className={layout === 'grid' ? 'mt-auto' : undefined}>
          <ServiceNoSlotsNotice serviceId={service.id} serviceTitle={service.title} />
        </div>
      ) : null}
    </li>
  );
}
