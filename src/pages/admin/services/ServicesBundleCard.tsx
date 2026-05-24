import { HiCheck, HiClock, HiEllipsisHorizontal, HiGift } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { servicesCard } from './adminServicesTheme';
import {
  bundleHasDiscount,
  bundleStatusLabel,
  resolveBundleDisplayImage,
} from './bundleUtils';
import { formatDurationRu } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  bundle: ServiceBundle;
  services: ManagedService[];
  draft: MasterDraft;
  serviceTitleById: Map<string, string>;
  onMenu?: () => void;
  className?: string;
};

function statusBadgeClass(status: ServiceBundle['status']): string {
  switch (status) {
    case 'visible':
      return 'bg-[#ECFDF5]/95 text-[#16A34A]';
    case 'hidden':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    default:
      return 'bg-white/90 text-[#6B7280]';
  }
}

export function ServicesBundleCard({
  bundle,
  services,
  draft,
  serviceTitleById,
  onMenu,
  className = '',
}: Props) {
  const img = resolveBundleDisplayImage(bundle, services, draft);
  const showDeal = bundleHasDiscount(bundle.originalPrice, bundle.bundlePrice);

  return (
    <article
      className={`${servicesCard} overflow-hidden lg:rounded-[24px] lg:border-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)] ${className}`}
    >
      <div className="flex gap-3.5 p-3.5 lg:min-h-[120px] lg:items-center lg:gap-5 lg:p-6">
        <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-[#FFF1F4] lg:h-20 lg:w-20 lg:rounded-[20px]">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF5F8] to-[#FFEEF2]">
              <HiGift className="h-9 w-9 text-[#F47C8C]" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {showDeal ? (
                <span className="inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F47C8C]">
                  Выгодно
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(bundle.status)}`}
              >
                {bundleStatusLabel(bundle.status)}
              </span>
            </div>
            {onMenu ? (
              <button
                type="button"
                onClick={onMenu}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280] transition active:scale-[0.96]"
                aria-label="Меню набора"
              >
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>

          <h3 className="mt-1.5 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827] lg:mt-0 lg:text-[22px] lg:font-black lg:tracking-[-0.05em]">
            {bundle.title}
          </h3>

          <ul className="mt-2 space-y-1">
            {bundle.serviceIds.map((id) => (
              <li key={id} className="flex items-start gap-1.5 text-[12px] text-[#6B7280]">
                <HiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47C8C]" aria-hidden />
                <span className="min-w-0 break-words">{serviceTitleById.get(id) ?? 'Услуга'}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 lg:mt-3">
            <span className="text-[20px] font-bold tabular-nums text-[#111827] lg:text-[32px] lg:font-black lg:tracking-[-0.06em] lg:text-[#ff5f7a]">
              {bundle.bundlePrice} BYN
            </span>
            {showDeal ? (
              <>
                <span className="text-[13px] text-[#9CA3AF] line-through">
                  {bundle.originalPrice} BYN
                </span>
                <span className="text-[12px] font-bold text-[#F47C8C]">
                  -{bundle.discountPercent}%
                </span>
                <span className="text-[12px] font-semibold text-[#22C55E]">
                  Экономия {bundle.discountAmount} BYN
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#9CA3AF]">
            <HiClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDurationRu(bundle.durationMinutes)}
          </p>
        </div>
      </div>
    </article>
  );
}
