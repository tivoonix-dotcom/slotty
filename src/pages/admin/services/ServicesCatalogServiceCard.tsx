import { Link } from 'react-router-dom';
import { HiCalendarDays, HiEllipsisHorizontal, HiInformationCircle } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { servicesCatalogCardMobile } from './adminServicesTheme';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice } from './servicesFormat';

type Props = {
  service: ManagedService;
  imageSrc: string | null;
  categoryLabel?: string | null;
  availableSlotsCount?: number;
  upcomingAppointmentsCount?: number;
  onOpenMenu?: (service: ManagedService) => void;
  highlighted?: boolean;
  showMenu?: boolean;
};

function ServiceNoSlotsNotice({ serviceId }: { serviceId: string }) {
  const scheduleUrl = `${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month&serviceId=${encodeURIComponent(serviceId)}`;

  return (
    <article
      className="mt-0 overflow-hidden rounded-[14px] border-l-[3px] border-l-[#F47C8C] bg-[#FFFBFC] ring-1 ring-[#FDE8ED] lg:mt-3"
      role="note"
    >
      <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]"
            aria-hidden
          >
            <HiInformationCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-[#111827]">Нет окон для записи</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">
              Клиенты видят услугу, но не смогут выбрать время
            </p>
          </div>
        </div>

        <Link
          to={scheduleUrl}
          className="inline-flex min-h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-[#F47C8C] px-3.5 text-[12px] font-semibold leading-none text-white transition hover:opacity-95 active:scale-[0.98] sm:w-auto sm:self-start"
        >
          <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          <span>Добавить окно</span>
        </Link>
      </div>
    </article>
  );
}

function ServiceMeta({
  service,
  categoryLabel,
  availableSlotsCount = 0,
  upcomingAppointmentsCount = 0,
  hideNoSlotsNotice = false,
}: Pick<Props, 'service' | 'categoryLabel' | 'availableSlotsCount' | 'upcomingAppointmentsCount'> & {
  hideNoSlotsNotice?: boolean;
}) {
  const visible = service.isActive !== false;
  const duration = formatDurationRu(service.durationMin ?? 60);
  const noSlots = visible && availableSlotsCount <= 0;

  return (
    <>
      <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
        {[categoryLabel, duration].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-2 text-[20px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#F47C8C] lg:text-[32px]">
        {formatServicePrice(service)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
            visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#6B7280]'
          }`}
        >
          {visible ? 'Видимая' : 'Скрытая'}
        </span>
        {visible ? (
          <span className="text-[12px] font-semibold text-[#6B7280]">
            {availableSlotsCount > 0
              ? `${availableSlotsCount} ${availableSlotsCount === 1 ? 'окно' : availableSlotsCount < 5 ? 'окна' : 'окон'}`
              : 'Нет окон'}
          </span>
        ) : null}
        {upcomingAppointmentsCount > 0 ? (
          <span className="text-[12px] font-semibold text-[#6B7280]">
            {upcomingAppointmentsCount} будущих записей
          </span>
        ) : null}
      </div>
      {!hideNoSlotsNotice && noSlots ? <ServiceNoSlotsNotice serviceId={service.id} /> : null}
    </>
  );
}

function serviceHasNoSlots(service: ManagedService, availableSlotsCount = 0): boolean {
  return service.isActive !== false && availableSlotsCount <= 0;
}

/** Карточка услуги в каталоге кабинета (мобилка + десктоп). */
export function CatalogServiceCard({
  service,
  imageSrc,
  categoryLabel,
  availableSlotsCount,
  upcomingAppointmentsCount,
  onOpenMenu,
  highlighted = false,
  showMenu = true,
}: Props) {
  const showNoSlotsNotice = serviceHasNoSlots(service, availableSlotsCount);

  return (
    <li
      className={`${servicesCatalogCardMobile} ${
        highlighted ? 'ring-2 ring-[#F47C8C]/35 ring-offset-2 ring-offset-white' : ''
      }`}
    >
      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3.5">
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              sizeClass="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[14px]"
            />
          ) : (
            <ServiceThumbnailFallback sizeClass="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[14px]" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827]">
                  {service.title}
                </h3>
                <ServiceMeta
                  service={service}
                  categoryLabel={categoryLabel}
                  availableSlotsCount={availableSlotsCount}
                  upcomingAppointmentsCount={upcomingAppointmentsCount}
                  hideNoSlotsNotice
                />
              </div>

              {showMenu && onOpenMenu ? (
                <button
                  type="button"
                  onClick={() => onOpenMenu(service)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition active:scale-[0.96]"
                  aria-label="Меню услуги"
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {showNoSlotsNotice ? <ServiceNoSlotsNotice serviceId={service.id} /> : null}
      </div>

      <div className="hidden min-h-[120px] items-center gap-5 px-6 py-5 lg:flex">
        {imageSrc ? (
          <ServiceThumbnail src={imageSrc} title={service.title} sizeClass="h-20 w-20 rounded-[20px]" />
        ) : (
          <ServiceThumbnailFallback sizeClass="flex h-20 w-20 items-center justify-center rounded-[20px]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-[#111827]">
            {service.title}
          </h3>
          <ServiceMeta
            service={service}
            categoryLabel={categoryLabel}
            availableSlotsCount={availableSlotsCount}
            upcomingAppointmentsCount={upcomingAppointmentsCount}
          />
        </div>

        {showMenu && onOpenMenu ? (
          <button
            type="button"
            onClick={() => onOpenMenu(service)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280] transition hover:bg-[#E4E4E4] active:scale-[0.96]"
            aria-label={`Меню: ${service.title}`}
          >
            <HiEllipsisHorizontal className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  );
}
