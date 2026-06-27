import { HiCalendarDays, HiChevronRight } from 'react-icons/hi2';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import { serviceCoverImageStyle } from '../../../features/catalog/serviceCoverPresentation';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { SectionHeading } from '../components/SectionHeading';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';
import { catalogDesktopPanel, catalogPrimaryBtn } from './masterProfileTheme';

type Props = {
  services: DemoMasterService[];
  categoryCode?: string;
  categoryLabel?: string;
  highlightServiceId?: string | null;
  onSelect: (service: DemoMasterService) => void;
  onViewAll?: () => void;
  onBookService?: (service: DemoMasterService) => void;
  layout?: 'stack' | 'desktop';
  previewMode?: boolean;
};

function servicesCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'услуга'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'услуги'
        : 'услуг';
  return `${count} ${word}`;
}

export function MasterServicesList({
  services,
  categoryCode,
  categoryLabel,
  highlightServiceId,
  onSelect,
  onViewAll,
  onBookService,
  layout = 'stack',
  previewMode = false,
}: Props) {
  const workPhotoCode = resolveCategoryWorkCode(categoryCode ?? categoryLabel);
  const workPhotoUrl = getCategoryWorkPhotoUrl(workPhotoCode);

  const servicePhoto = (service: DemoMasterService) =>
    service.coverImageUrl?.trim() || workPhotoUrl;

  const servicePhotoStyle = (service: DemoMasterService) =>
    serviceCoverImageStyle({
      focalX: service.coverFocalX,
      focalY: service.coverFocalY,
    });

  const sorted = [...services].sort((a, b) => {
    if (highlightServiceId) {
      if (a.id === highlightServiceId) return -1;
      if (b.id === highlightServiceId) return 1;
    }
    return 0;
  });
  const visible = sorted;
  const isDesktop = layout === 'desktop';
  const previewListClass = previewMode
    ? 'flex flex-col gap-3'
    : isDesktop
      ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-2'
      : 'space-y-3';

  const previewCardClass = (highlighted: boolean) =>
    `group flex w-full items-center gap-3 rounded-[16px] bg-white p-3.5 text-left ${
      highlighted ? 'ring-2 ring-[#F47C8C]/25' : ''
    }`;

  if (!visible.length) {
    return (
      <section className={`${isDesktop ? '' : 'mt-0'} rounded-[16px] bg-[#FAFAFA] px-4 py-8 text-center ${isDesktop ? catalogDesktopPanel : ''}`}>
        <p className="text-[15px] font-semibold text-[#111827]">Мастер пока не добавил услуги</p>
      </section>
    );
  }

  return (
    <section className={isDesktop ? '' : 'mt-0'}>
      <SectionHeading
        title="Услуги мастера"
        subtitle={
          previewMode
            ? servicesCountLabel(services.length)
            : isDesktop
              ? `${servicesCountLabel(services.length)} · выберите и запишитесь`
              : 'Выберите услугу и запишитесь'
        }
        linkLabel={isDesktop ? undefined : 'Все услуги'}
        onLinkClick={isDesktop ? undefined : onViewAll}
        className="mb-4"
      />

      <ul className={previewListClass}>
        {visible.map((service) => {
          const highlighted = service.id === highlightServiceId;
          const cardClass = previewMode
            ? previewCardClass(highlighted)
            : isDesktop
              ? `group flex h-full flex-col overflow-hidden rounded-[20px] bg-white text-left ${
                  highlighted ? 'ring-2 ring-[#F47C8C]/25' : ''
                } transition hover:-translate-y-0.5`
              : `group flex w-full items-center gap-4 rounded-[16px] bg-white p-4 text-left ${
                  highlighted ? 'bg-[#FFF1F4]' : ''
                } transition active:scale-[0.99] hover:bg-[#FFF1F4]`;

          if (isDesktop && !previewMode) {
            return (
              <li key={service.id} className="flex">
                <article className={`${cardClass} w-full`}>
                  <button type="button" onClick={() => onSelect(service)} className="block w-full text-left">
                    <ImageReveal
                      src={servicePhoto(service)}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                      style={service.coverImageUrl ? servicePhotoStyle(service) : undefined}
                      loading="lazy"
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <p className="font-bold leading-snug text-[#111827] text-[17px]">{service.title}</p>
                      {service.description?.trim() ? (
                        <p className="mt-1 line-clamp-2 text-[13px] text-[#6B7280]">{service.description.trim()}</p>
                      ) : null}
                      <p className="mt-2 inline-flex w-fit rounded-[8px] bg-[#F5F5F5] px-2 py-0.5 text-[12px] font-semibold text-[#6B7280]">
                        {serviceDurationLabel(service.duration)}
                      </p>
                      <p className="mt-3 text-[20px] font-bold text-[#111827]">{formatServicePrice(service)}</p>
                    </div>
                  </button>
                  <div className="mt-auto border-t border-[#F0F0F0] p-4 pt-3">
                    <button
                      type="button"
                      onClick={() => (onBookService ?? onSelect)(service)}
                      className={`${catalogPrimaryBtn} w-full min-h-10 gap-2 text-[13px]`}
                    >
                      <HiCalendarDays className="h-4 w-4" aria-hidden />
                      Выбрать время
                    </button>
                  </div>
                </article>
              </li>
            );
          }

          const cardBody = (
            <>
              <ImageReveal
                src={servicePhoto(service)}
                alt=""
                className={`shrink-0 rounded-[14px] object-cover ${
                  isDesktop || previewMode ? 'h-[72px] w-[72px]' : 'h-16 w-16'
                }`}
                style={service.coverImageUrl ? servicePhotoStyle(service) : undefined}
                loading="lazy"
              />

              <div className="min-w-0 flex-1">
                <p
                  className={`line-clamp-2 font-bold leading-snug text-[#111827] ${
                    isDesktop || previewMode ? 'text-[17px]' : 'text-[16px]'
                  }`}
                >
                  {service.title}
                </p>
                <p className="mt-1 inline-flex rounded-[8px] bg-[#F5F5F5] px-2 py-0.5 text-[12px] font-semibold text-[#6B7280] group-hover:bg-white/80">
                  {serviceDurationLabel(service.duration)}
                </p>
              </div>

              {previewMode ? (
                <p className="shrink-0 text-right text-[18px] font-bold tabular-nums text-[#111827]">
                  {formatServicePrice(service)}
                </p>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className={`font-bold text-[#111827] ${isDesktop ? 'text-[18px]' : 'text-[17px]'}`}>
                      {formatServicePrice(service)}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[#F47C8C]">Подробнее</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C] transition group-hover:bg-[#F47C8C] group-hover:text-white">
                    <HiChevronRight className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              )}
            </>
          );

          return (
            <li key={service.id}>
              {previewMode ? (
                <div className={cardClass}>{cardBody}</div>
              ) : (
                <button type="button" onClick={() => onSelect(service)} className={cardClass}>
                  {cardBody}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
