import { HiChevronRight, HiSparkles } from 'react-icons/hi2';
import { SectionHeading } from '../components/SectionHeading';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';

type Props = {
  services: DemoMasterService[];
  highlightServiceId?: string | null;
  onSelect: (service: DemoMasterService) => void;
  onViewAll?: () => void;
};

export function MasterServicesList({
  services,
  highlightServiceId,
  onSelect,
  onViewAll,
}: Props) {
  const sorted = [...services].sort((a, b) => {
    if (highlightServiceId) {
      if (a.id === highlightServiceId) return -1;
      if (b.id === highlightServiceId) return 1;
    }
    return 0;
  });
  const visible = sorted.slice(0, 5);

  if (!visible.length) {
    return (
      <section className="mt-8 rounded-[22px] bg-[#FAFAFA] px-4 py-8 text-center">
        <p className="text-[15px] font-semibold text-[#111827]">Мастер пока не добавил услуги</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <SectionHeading title="Услуги мастера" linkLabel="Все услуги" onLinkClick={onViewAll} />
      <ul className="space-y-2">
        {visible.map((service) => {
          const highlighted = service.id === highlightServiceId;
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => onSelect(service)}
                className={`flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition active:scale-[0.99] ${
                  highlighted
                    ? 'bg-[#FFF1F4] ring-2 ring-[#F47C8C]/25'
                    : 'bg-white shadow-[0_4px_20px_rgba(17,24,39,0.05)]'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
                  <HiSparkles className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold text-[#111827]">{service.title}</p>
                  <p className="mt-0.5 text-[13px] text-[#9CA3AF]">
                    {serviceDurationLabel(service.duration)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-[15px] font-semibold text-[#111827]">
                    {formatServicePrice(service)}
                  </span>
                  <HiChevronRight className="h-5 w-5 text-[#D1D5DB]" aria-hidden />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
