import { HiEllipsisHorizontal, HiPencilSquare, HiWallet } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesIconCircle,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice, serviceImageUrl } from './servicesFormat';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onEdit: (service: ManagedService) => void;
  onOpenMenu: (service: ManagedService) => void;
};

export function ServicesPriceTab({ draft, services, onEdit, onOpenMenu }: Props) {
  const avg =
    services.length > 0
      ? Math.round(services.reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0) / services.length)
      : 0;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[22px] border border-[#FDE8ED] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] p-5 shadow-[0_10px_32px_rgba(244,124,140,0.12)]">
        <span className={`${servicesIconCircle} absolute right-4 top-4 h-12 w-12`}>
          <HiWallet className="h-6 w-6" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold text-[#6B7280]">Сводка по прайсу</p>
        <p className="mt-2 text-[32px] font-bold tracking-[-0.06em] text-[#111827]">{services.length}</p>
        <p className="text-[12px] font-medium text-[#9CA3AF]">услуг в каталоге</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-bold text-[#111827] shadow-sm">
            Средний чек {avg > 0 ? `${avg} BYN` : '—'}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]">
            Динамика — скоро
          </span>
        </div>
      </section>

      {services.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <p className="text-[15px] font-semibold text-[#6B7280]">Добавьте услуги в каталоге</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => {
            const img = serviceImageUrl(service, draft);
            return (
              <li key={service.id} className={`${servicesCard} p-4`}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[#FFF1F4]">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#F47C8C]">
                        {service.title.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-[#111827]">{service.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenMenu(service)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280]"
                    aria-label="Меню"
                  >
                    <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(service)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-[12px] bg-[#FFF1F4] px-3 py-2 text-[13px] font-bold text-[#F47C8C] transition active:scale-[0.96]"
                  >
                    {formatServicePrice(service)}
                    <HiPencilSquare className="h-4 w-4 opacity-70" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(service)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-[12px] bg-[#F3F4F6] px-3 py-2 text-[13px] font-semibold text-[#374151] transition active:scale-[0.96]"
                  >
                    {formatDurationRu(service.durationMin)}
                    <HiPencilSquare className="h-4 w-4 opacity-50" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
