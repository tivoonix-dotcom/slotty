import type { ElementType } from 'react';
import { HiCheck, HiClock, HiEllipsisHorizontal, HiGift } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { cabinetIconCircle } from '../profile/adminProfileCabinetTheme';
import {
  servicesCatalogCardBody,
  servicesCatalogCardGridShell,
  servicesCatalogCardShell,
  servicesCatalogCardThumbCol,
  servicesCatalogMenuBtn,
  servicesCatalogMetaMuted,
} from './adminServicesTheme';
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
  layout?: 'list' | 'grid';
  onMenu?: () => void;
  className?: string;
  as?: 'li' | 'article';
  examplePreview?: boolean;
};

function statusBadgeClass(status: ServiceBundle['status']): string {
  switch (status) {
    case 'visible':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'hidden':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    default:
      return 'bg-[#FFF4E8] text-[#B45309]';
  }
}

export function ServicesBundleCard({
  bundle,
  services,
  draft,
  serviceTitleById,
  layout = 'list',
  onMenu,
  className = '',
  as = 'article',
  examplePreview = false,
}: Props) {
  const img = resolveBundleDisplayImage(bundle, services, draft);
  const showDeal = bundleHasDiscount(bundle.originalPrice, bundle.bundlePrice);
  const shell =
    layout === 'grid' ? servicesCatalogCardGridShell : servicesCatalogCardShell;
  const Tag = as as ElementType;

  return (
    <Tag
      className={`${shell} ${examplePreview ? 'ring-2 ring-dashed ring-[#D1D5DB]' : ''} ${className}`.trim()}
    >
      <div className={servicesCatalogCardBody}>
        <div className={servicesCatalogCardThumbCol}>
          {img ? (
            <img
              src={img}
              alt=""
              className="absolute inset-0 h-full w-full rounded-l-[16px] object-cover lg:rounded-l-[18px]"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full min-h-[5.5rem] w-full items-center justify-center rounded-l-[16px] bg-[#EBEBEB] lg:rounded-l-[18px]">
              <span className={`${cabinetIconCircle} h-11 w-11 rounded-[12px]`}>
                <HiGift className="h-5 w-5" aria-hidden />
              </span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-3.5 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {examplePreview ? (
                <span className="inline-flex rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#92400E] ring-1 ring-[#FDE68A]">
                  Только пример
                </span>
              ) : (
                <>
                  {showDeal ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold text-[#F47C8C]">
                      <span aria-hidden>🔥</span>
                      Выгодно
                    </span>
                  ) : null}
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(bundle.status)}`}
                  >
                    {bundle.status === 'visible' ? <span aria-hidden>✅</span> : null}
                    {bundleStatusLabel(bundle.status)}
                  </span>
                </>
              )}
            </div>
            {onMenu ? (
              <button
                type="button"
                onClick={onMenu}
                className={servicesCatalogMenuBtn}
                aria-label="Меню набора"
              >
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:text-[16px]">
            {bundle.title}
          </h3>

          <ul className="mt-1.5 space-y-0.5">
            {bundle.serviceIds.slice(0, 4).map((id) => (
              <li key={id} className={`flex items-start gap-1.5 ${servicesCatalogMetaMuted} text-[12px]`}>
                <HiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47C8C]" aria-hidden />
                <span className="min-w-0 line-clamp-1">{serviceTitleById.get(id) ?? 'Услуга'}</span>
              </li>
            ))}
            {bundle.serviceIds.length > 4 ? (
              <li className={`${servicesCatalogMetaMuted} text-[12px]`}>
                + ещё {bundle.serviceIds.length - 4}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#F0F0F0] px-3.5 py-3 sm:px-4">
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-[22px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#F47C8C]">
            {bundle.bundlePrice} BYN
          </span>
          {showDeal ? (
            <>
              <span className="pb-0.5 text-[13px] font-medium text-[#9CA3AF] line-through">
                {bundle.originalPrice} BYN
              </span>
              <span className="mb-0.5 inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[11px] font-bold text-[#F47C8C]">
                -{bundle.discountPercent}%
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280]">
            <HiClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[14px] font-bold tabular-nums leading-none text-[#111827]">
              {formatDurationRu(bundle.durationMinutes)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">Продолжительность</p>
          </div>
        </div>
      </div>
    </Tag>
  );
}
