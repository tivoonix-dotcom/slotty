import { HiChevronRight } from 'react-icons/hi2';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { SectionHeading } from '../components/SectionHeading';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = {
  services: DemoMasterService[];
  categoryCode?: string;
  categoryLabel?: string;
  highlightServiceId?: string | null;
  onSelect: (service: DemoMasterService) => void;
  onViewAll?: () => void;
  layout?: 'stack' | 'desktop';
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
  layout = 'stack',
}: Props) {
  const workPhotoCode = resolveCategoryWorkCode(categoryCode ?? categoryLabel);
  const workPhotoUrl = getCategoryWorkPhotoUrl(workPhotoCode);

  const sorted = [...services].sort((a, b) => {
    if (highlightServiceId) {
      if (a.id === highlightServiceId) return -1;
      if (b.id === highlightServiceId) return 1;
    }
    return 0;
  });
  const visible = sorted;
  const isDesktop = layout === 'desktop';

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
          isDesktop
            ? `${servicesCountLabel(services.length)} · выберите и запишитесь`
            : 'Выберите услугу и запишитесь'
        }
        linkLabel={isDesktop ? undefined : 'Все услуги'}
        onLinkClick={isDesktop ? undefined : onViewAll}
        className="mb-4"
      />

      <ul className={isDesktop ? 'space-y-3' : 'space-y-3'}>
        {visible.map((service) => {
          const highlighted = service.id === highlightServiceId;
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => onSelect(service)}
                className={
                  isDesktop
                    ? `group flex w-full items-center gap-4 rounded-[16px] bg-white p-4 text-left ring-1 ring-[#EEEEEE] transition hover:bg-[#FFF1F4] hover:ring-[#F47C8C]/25 lg:p-5 ${
                        highlighted ? 'bg-[#FFF1F4] ring-2 ring-[#F47C8C]/30' : ''
                      }`
                    : `group flex w-full items-center gap-4 rounded-[16px] bg-white p-4 text-left ring-1 ring-[#EEEEEE] transition active:scale-[0.99] hover:bg-[#FFF1F4] hover:ring-[#F47C8C]/25 ${
                        highlighted ? 'bg-[#FFF1F4] ring-2 ring-[#F47C8C]/30' : ''
                      }`
                }
              >
                <ImageReveal
                  src={workPhotoUrl}
                  alt=""
                  className={`shrink-0 rounded-[14px] object-cover ring-2 ring-white ${
                    isDesktop ? 'h-[72px] w-[72px]' : 'h-16 w-16'
                  }`}
                  loading="lazy"
                />

                <div className="min-w-0 flex-1">
                  <p className={`font-bold leading-snug text-[#111827] ${isDesktop ? 'text-[17px]' : 'text-[16px]'}`}>
                    {service.title}
                  </p>
                  <p className="mt-1 inline-flex rounded-[8px] bg-[#F5F5F5] px-2 py-0.5 text-[12px] font-semibold text-[#6B7280] group-hover:bg-white/80">
                    {serviceDurationLabel(service.duration)}
                  </p>
                </div>

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
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
