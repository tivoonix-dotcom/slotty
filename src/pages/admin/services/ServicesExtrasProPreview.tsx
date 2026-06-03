import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
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
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          aria-labelledby={`services-pro-gate-${variant}`}
        >
          <h2
            id={`services-pro-gate-${variant}`}
            className="text-[16px] font-bold tracking-[-0.02em] text-[#111827] sm:text-[17px]"
          >
            {featureLabel} · {MASTER_PRO_PLAN_NAME}
          </h2>
          <Link
            to={ADMIN_BILLING_PATH}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[#ff5f7a] px-4 text-[13px] font-bold text-white transition hover:bg-[#f04f6c] active:scale-[0.98]"
          >
            {copy.fabLabel}
            <HiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

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
