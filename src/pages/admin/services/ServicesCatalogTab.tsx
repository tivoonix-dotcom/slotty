import { useMemo, useState } from 'react';
import { HiEllipsisHorizontal, HiFunnel, HiMagnifyingGlass, HiScissors } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesChip,
  servicesChipActive,
  servicesChipIdle,
  servicesIconCircle,
  servicesInput,
  servicesPinkBtn,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice, serviceImageUrl } from './servicesFormat';

type VisibilityFilter = 'all' | 'visible' | 'hidden';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onAdd: () => void;
  onOpenMenu: (service: ManagedService) => void;
};

export function ServicesCatalogTab({ draft, services, onAdd, onOpenMenu }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VisibilityFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (filter === 'visible' && !s.isActive) return false;
      if (filter === 'hidden' && s.isActive) return false;
      if (!q) return true;
      return s.title.toLowerCase().includes(q);
    });
  }, [filter, query, services]);

  const chips: Array<{ id: VisibilityFilter; label: string }> = [
    { id: 'all', label: 'Все' },
    { id: 'visible', label: 'Видимые' },
    { id: 'hidden', label: 'Скрытые' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
            className={`${servicesInput} pl-11`}
          />
        </label>
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[#EAECEF] bg-white text-[#6B7280] transition active:scale-[0.96]"
          aria-label="Фильтр"
        >
          <HiFunnel className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <button type="button" onClick={onAdd} className={servicesPinkBtn}>
        + Добавить услугу
      </button>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`${servicesChip} ${filter === c.id ? servicesChipActive : servicesChipIdle}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiScissors className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {services.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте первую услугу, чтобы клиенты могли записываться'
              : 'Попробуйте другой запрос или фильтр'}
          </p>
          {services.length === 0 ? (
            <button type="button" onClick={onAdd} className={`${servicesPinkBtn} mt-5`}>
              Добавить услугу
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((service) => {
            const img = serviceImageUrl(service, draft);
            return (
              <li key={service.id} className={`${servicesCard} flex gap-3 p-3.5`}>
                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px] bg-[#FFF1F4]">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#F47C8C]">
                      <HiScissors className="h-7 w-7" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
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
                      service.isActive
                        ? 'bg-[#ECFDF5] text-[#16A34A]'
                        : 'bg-[#F3F4F6] text-[#6B7280]'
                    }`}
                  >
                    {service.isActive ? 'Видимая' : 'Скрытая'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
