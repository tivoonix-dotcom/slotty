import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiLockClosed } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { MASTER_PRO_PLAN_NAME } from '../../../features/billing/masterProUpsell';
import {
  servicesDesktopCardPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { PromotionBannerCard } from './PromotionBannerCard';
import { demoBundlesForPreview, demoPromotionsForPreview } from './servicesExtrasDemo';
import { derivePromotionStatus } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import { ServicesTabFab } from './ServicesTabFab';
import { servicesProUpsellCopy, type ServicesProUpsellVariant } from './servicesProUpsell';

type Props = {
  variant: ServicesProUpsellVariant;
  draft: MasterDraft;
  services: ManagedService[];
  onConnectPro: () => void;
};

export function ServicesExtrasProPreview({ variant, draft, services, onConnectPro }: Props) {
  const copy = servicesProUpsellCopy(variant);
  const bundleExamples = demoBundlesForPreview(services);
  const promoExamples = demoPromotionsForPreview(services).map((p) => ({
    ...p,
    status: derivePromotionStatus(p),
  }));
  const exampleCount = variant === 'bundles' ? bundleExamples.length : promoExamples.length;

  const [exampleIndex, setExampleIndex] = useState(0);
  const safeIndex = Math.min(exampleIndex, Math.max(0, exampleCount - 1));
  const bundlePreview = bundleExamples[safeIndex];
  const promoPreview = promoExamples[safeIndex];

  const serviceTitleById = new Map(services.map((s) => [s.id, s.title]));

  const featureLabel = variant === 'bundles' ? 'Наборы услуг' : 'Акции';

  return (
    <div className={`relative ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-4 lg:space-y-5 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
        <section
          className="rounded-[18px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5 lg:rounded-[20px]"
          aria-labelledby={`services-pro-gate-${variant}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#ff5f7a]">
                <HiLockClosed className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Тариф Free · откроется с Pro
                </p>
                <h2
                  id={`services-pro-gate-${variant}`}
                  className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[20px]"
                >
                  {featureLabel} — в подписке {MASTER_PRO_PLAN_NAME}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#4B5563]">{copy.lead}</p>
                <p className="mt-2 text-[13px] font-medium text-[#6B7280]">
                  Сейчас раздел только для просмотра. После подключения Pro вы сможете создавать свои{' '}
                  {variant === 'bundles' ? 'наборы' : 'акции'} — они появятся у клиентов в каталоге.
                </p>
              </div>
            </div>
            <Link
              to={ADMIN_BILLING_PATH}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[14px] bg-[#ff5f7a] px-5 text-[14px] font-bold text-white transition hover:bg-[#f04f6c] active:scale-[0.98] sm:min-w-[11rem]"
            >
              {copy.cta}
              <HiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section
          className="rounded-[18px] bg-[#F6F7FB] p-4 lg:rounded-[20px] lg:p-5"
          aria-label="Пример карточки для клиентов"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-[#374151]">Так будет выглядеть</p>
              <p className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                Один пример · не сохраняется и клиентам не показывается
              </p>
            </div>
            {exampleCount > 1 ? (
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Примеры">
                {Array.from({ length: exampleCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === safeIndex}
                    aria-label={`Пример ${i + 1}`}
                    onClick={() => setExampleIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === safeIndex ? 'w-6 bg-[#ff5f7a]' : 'w-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none mt-4 select-none" aria-hidden>
            {variant === 'bundles' && bundlePreview ? (
              <ServicesBundleCard
                bundle={bundlePreview}
                services={services}
                draft={draft}
                serviceTitleById={serviceTitleById}
                examplePreview
              />
            ) : null}
            {variant === 'promotions' && promoPreview ? (
              <PromotionBannerCard promo={promoPreview} examplePreview className="lg:min-h-[180px]" />
            ) : null}
          </div>
        </section>
      </div>

      <ServicesTabFab ariaLabel={copy.fabLabel} onClick={onConnectPro} />
    </div>
  );
}
