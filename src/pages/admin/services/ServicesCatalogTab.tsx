import { useMemo, useState } from 'react';
import {
  HiEllipsisHorizontal,
  HiFunnel,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesDesktopCardPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
  servicesInput,
} from './adminServicesTheme';
import { ServicesTabFab } from './ServicesTabFab';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import { filterCatalogServices } from './catalogFilterUtils';
import type { ManagedService } from './servicesFormat';
import {
  formatDurationRu,
  formatServicePrice,
  serviceCatalogThumbnailUrl,
} from './servicesFormat';
import {
  catalogFiltersAreActive,
  DEFAULT_CATALOG_FILTERS,
  ServicesCatalogFiltersSheet,
  type CatalogFiltersState,
} from './ServicesCatalogFiltersSheet';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onAdd: () => void;
  onOpenMenu: (service: ManagedService) => void;
};

function serviceCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} услуг`;
  if (mod10 === 1) return `${n} услуга`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} услуги`;

  return `${n} услуг`;
}

function CatalogServiceCard({
  service,
  imageSrc,
  onOpenMenu,
}: {
  service: ManagedService;
  imageSrc: string | null;
  onOpenMenu: (service: ManagedService) => void;
}) {
  const visible = service.isActive !== false;

  return (
    <li
      className={`${servicesCard} p-4 lg:rounded-[24px] lg:border-0 lg:p-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]`}
    >
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-start gap-3">
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              sizeClass="h-14 w-14 rounded-[16px]"
            />
          ) : (
            <ServiceThumbnailFallback sizeClass="flex h-14 w-14 items-center justify-center rounded-[16px]" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[16px] font-bold text-[#111827]">{service.title}</h3>
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-[#F47C8C]">
                  {formatServicePrice(service)}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                  {formatDurationRu(service.durationMin)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenMenu(service)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280] transition active:scale-[0.96]"
                aria-label="Меню услуги"
              >
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}
            >
              {visible ? 'Видимая' : 'Скрытая'}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop — акцент на услуге, на всю ширину */}
      <div className="hidden min-h-[120px] items-center gap-5 px-6 py-5 lg:flex">
        {imageSrc ? (
          <ServiceThumbnail
            src={imageSrc}
            title={service.title}
            sizeClass="h-20 w-20 rounded-[20px]"
          />
        ) : (
          <ServiceThumbnailFallback sizeClass="flex h-20 w-20 items-center justify-center rounded-[20px]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-[#111827]">
            {service.title}
          </h3>
          <p className="mt-1.5 text-[15px] font-semibold text-[#6B7280]">
            {formatDurationRu(service.durationMin)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[32px] font-black tabular-nums leading-none tracking-[-0.06em] text-[#ff5f7a]">
            {formatServicePrice(service)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
            visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#f6f7fb] text-[#6B7280]'
          }`}
        >
          {visible ? 'Видимая' : 'Скрытая'}
        </span>

        <button
          type="button"
          onClick={() => onOpenMenu(service)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#f6f7fb] text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.96]"
          aria-label={`Меню: ${service.title}`}
        >
          <HiEllipsisHorizontal className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function ServicesCatalogTab({ draft, services, onAdd, onOpenMenu }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFiltersState>(DEFAULT_CATALOG_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () => filterCatalogServices(services, query, filters),
    [filters, query, services],
  );

  const filterIsActive = catalogFiltersAreActive(filters);

  const patchFilters = (patch: Partial<CatalogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className={`relative space-y-4 lg:space-y-0 ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-4 lg:space-y-5 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
      <div className="hidden lg:flex lg:items-end lg:justify-between lg:gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Услуги в каталоге
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {filtered.length > 0
              ? `Показано ${serviceCountLabel(filtered.length)}`
              : 'Добавьте услуги — клиенты увидят их при записи'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <label className="relative min-w-0 flex-1">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
            className={`${servicesInput} pl-11 lg:min-h-[52px] lg:rounded-[18px] lg:pl-12 lg:text-[16px]`}
          />
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] lg:h-[52px] lg:w-[52px] lg:rounded-[18px] ${
            filterIsActive
              ? 'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]'
              : 'border-[#EAECEF] bg-white text-[#6B7280]'
          }`}
          aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры каталога'}
          aria-expanded={filterOpen}
        >
          <HiFunnel className="h-5 w-5" aria-hidden />
          {filterIsActive ? (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F47C8C]"
              aria-hidden
            />
          ) : null}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {services.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте первую услугу, чтобы клиенты могли записываться'
              : 'Попробуйте другой запрос или фильтр'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3 lg:space-y-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
          {filtered.map((service) => (
            <CatalogServiceCard
              key={service.id}
              service={service}
              imageSrc={serviceCatalogThumbnailUrl(service, draft)}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </ul>
      )}

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        filters={filters}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
        onClose={() => setFilterOpen(false)}
      />
      </div>

      <ServicesTabFab ariaLabel="Добавить услугу" onClick={onAdd} />
    </div>
  );
}
