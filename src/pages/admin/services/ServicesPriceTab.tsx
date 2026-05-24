import type { ReactNode } from 'react';
import { HiClock, HiPencilSquare, HiWallet } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesDesktopCardPad,
  servicesTabPanelShell,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import {
  formatDurationRu,
  formatServicePrice,
  serviceCatalogThumbnailUrl,
} from './servicesFormat';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onEditPrice: (service: ManagedService) => void;
  onEditDuration: (service: ManagedService) => void;
};

function QuickEditButton({
  label,
  value,
  hint,
  tone,
  icon,
  onClick,
  className = '',
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'price' | 'time';
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const toneClass =
    tone === 'price'
      ? 'border-[#FDE8ED] bg-[#FFF1F4] hover:border-[#ff9aad] hover:bg-[#FFE8EE] focus-visible:ring-[#ff5f7a]/30'
      : 'border-[#E5E7EB] bg-[#f6f7fb] hover:border-[#D1D5DB] hover:bg-white focus-visible:ring-[#9CA3AF]/30';

  const labelClass = tone === 'price' ? 'text-[#ff5f7a]' : 'text-[#6B7280]';
  const valueClass = tone === 'price' ? 'text-[#ff5f7a]' : 'text-[#111827]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col rounded-[18px] border-2 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(17,24,39,0.08)] focus:outline-none focus-visible:ring-4 active:scale-[0.99] lg:min-h-[104px] lg:rounded-[20px] lg:px-5 lg:py-4 ${toneClass} ${className}`}
    >
      <span className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] ${labelClass}`}>
        {icon}
        {label}
        <HiPencilSquare
          className={`ml-auto h-4 w-4 opacity-60 transition group-hover:opacity-100 ${labelClass}`}
          aria-hidden
        />
      </span>
      <span
        className={`mt-2 text-[22px] font-black tabular-nums leading-none tracking-[-0.05em] lg:text-[28px] ${valueClass}`}
      >
        {value}
      </span>
      <span className="mt-2 text-[12px] font-semibold text-[#9CA3AF] group-hover:text-[#6B7280] lg:text-[13px]">
        {hint}
      </span>
    </button>
  );
}

function PriceServiceCard({
  service,
  imageSrc,
  onEditPrice,
  onEditDuration,
}: {
  service: ManagedService;
  imageSrc: string;
  onEditPrice: () => void;
  onEditDuration: () => void;
}) {
  return (
    <li
      className={`${servicesCard} overflow-hidden p-4 lg:rounded-[24px] lg:border-0 lg:p-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]`}
    >
      <div className="lg:hidden">
        <div className="flex items-start gap-3">
          <ServiceThumbnail src={imageSrc} title={service.title} sizeClass="h-14 w-14 rounded-[16px]" />
          <h3 className="min-w-0 flex-1 text-[16px] font-bold leading-snug text-[#111827]">
            {service.title}
          </h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <QuickEditButton
            label="Цена"
            value={formatServicePrice(service)}
            hint="Нажмите, чтобы изменить"
            tone="price"
            icon={<HiWallet className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={onEditPrice}
          />
          <QuickEditButton
            label="Время"
            value={formatDurationRu(service.durationMin)}
            hint="Нажмите, чтобы изменить"
            tone="time"
            icon={<HiClock className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={onEditDuration}
          />
        </div>
      </div>

      <div className="hidden lg:flex lg:min-h-[132px] lg:items-center lg:gap-5 lg:px-6 lg:py-5">
        <ServiceThumbnail src={imageSrc} title={service.title} sizeClass="h-20 w-20 rounded-[20px]" />

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-[#111827]">
            {service.title}
          </h3>
          <p className="mt-1.5 text-[13px] font-semibold text-[#9CA3AF]">
            Быстрое редактирование — нажмите на поле справа
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <QuickEditButton
            label="Цена"
            value={formatServicePrice(service)}
            hint="Изменить цену"
            tone="price"
            icon={<HiWallet className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={onEditPrice}
            className="w-[min(12rem,22vw)]"
          />
          <QuickEditButton
            label="Время"
            value={formatDurationRu(service.durationMin)}
            hint="Изменить длительность"
            tone="time"
            icon={<HiClock className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={onEditDuration}
            className="w-[min(11rem,20vw)]"
          />
        </div>
      </div>
    </li>
  );
}

export function ServicesPriceTab({ draft, services, onEditPrice, onEditDuration }: Props) {
  return (
    <div className={`space-y-4 lg:space-y-0 ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-4 lg:space-y-5 ${servicesDesktopCardPad}`}>
        <div className="hidden lg:block">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Быстрое редактирование прайса
          </h2>
          <p className="mt-1 max-w-[640px] text-[14px] font-semibold leading-relaxed text-[#6B7280]">
            Нажмите на розовое поле «Цена» или серое «Время» — откроется короткая форма без
            полного редактирования услуги.
          </p>
        </div>

        <p className="rounded-[16px] bg-[#FFF1F4] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#B45309] lg:hidden">
          Нажмите на цену или время у услуги — изменения сразу попадут в каталог и запись.
        </p>

        {services.length === 0 ? (
          <div className={`${servicesCard} p-6 text-center`}>
            <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
            <p className="mt-4 text-[15px] font-semibold text-[#6B7280]">
              Добавьте услуги в каталоге
            </p>
          </div>
        ) : (
          <ul className="space-y-3 lg:space-y-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
            {services.map((service) => (
              <PriceServiceCard
                key={service.id}
                service={service}
                imageSrc={serviceCatalogThumbnailUrl(service, draft)}
                onEditPrice={() => onEditPrice(service)}
                onEditDuration={() => onEditDuration(service)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
