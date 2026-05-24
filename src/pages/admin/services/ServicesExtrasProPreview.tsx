import { Link } from 'react-router-dom';
import { HiLockClosed, HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
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

type Variant = 'bundles' | 'promotions';

const COPY: Record<
  Variant,
  { title: string; subtitle: string; fabLabel: string }
> = {
  bundles: {
    title: 'Наборы услуг',
    subtitle: 'Комбо из нескольких услуг со скидкой — так будет выглядеть раздел после Pro.',
    fabLabel: 'Создать набор (Pro)',
  },
  promotions: {
    title: 'Акции и скидки',
    subtitle: 'Баннеры акций в каталоге и при записи — пример интерфейса с тарифом Pro.',
    fabLabel: 'Создать акцию (Pro)',
  },
};

type Props = {
  variant: Variant;
  draft: MasterDraft;
  services: ManagedService[];
  onConnectPro: () => void;
};

export function ServicesExtrasProPreview({ variant, draft, services, onConnectPro }: Props) {
  const copy = COPY[variant];
  const demoBundles = demoBundlesForPreview(services);
  const demoPromos = demoPromotionsForPreview(services).map((p) => ({
    ...p,
    status: derivePromotionStatus(p),
  }));

  const serviceTitleById = new Map(services.map((s) => [s.id, s.title]));

  return (
    <div className={`relative ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-5 lg:space-y-6 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
        <section className="rounded-[22px] border border-[#FDE8ED] bg-gradient-to-br from-[#FFF8F9] via-white to-[#FFF5F5] p-4 lg:rounded-[24px] lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#FFF1F4] text-[#ff5f7a]">
                <HiSparkles className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#ff5f7a]">
                  Пример с {planBadgeLabel('pro')}
                </p>
                <h2 className="mt-1 text-[20px] font-black tracking-[-0.05em] text-[#111827] lg:text-[22px]">
                  {copy.title}
                </h2>
                <p className="mt-2 max-w-[560px] text-[14px] font-semibold leading-relaxed text-[#6B7280]">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <Link
              to={ADMIN_BILLING_PATH}
              className="hidden shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-6 py-3 text-[14px] font-bold text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98] sm:inline-flex"
            >
              Подключить Pro
            </Link>
          </div>
        </section>

        <div className="hidden lg:block">
          <p className="text-[13px] font-semibold text-[#9CA3AF]">
            Ниже — демо-карточки. После Pro вы сможете создавать свои наборы и акции.
          </p>
        </div>

        <div
          className="pointer-events-none select-none space-y-4 lg:space-y-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4"
          aria-hidden
        >
          {variant === 'bundles'
            ? demoBundles.map((bundle) => (
                <div key={bundle.id} className="relative">
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-[#111827]/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    Демо
                  </span>
                  <ServicesBundleCard
                    bundle={bundle}
                    services={services}
                    draft={draft}
                    serviceTitleById={serviceTitleById}
                  />
                </div>
              ))
            : demoPromos.map((promo) => (
                <div key={promo.id} className="relative">
                  <span className="absolute left-4 top-4 z-30 rounded-full bg-[#111827]/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    Демо
                  </span>
                  <PromotionBannerCard promo={promo} className="lg:min-h-[180px]" />
                </div>
              ))}
        </div>

        <div className="pointer-events-none flex justify-center py-2 lg:hidden">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#111827]/85 px-4 py-2 text-[12px] font-bold text-white">
            <HiLockClosed className="h-4 w-4" aria-hidden />
            Доступно в Pro
          </span>
        </div>

        <p className="text-center text-[12px] font-medium text-[#9CA3AF] sm:hidden">
          Подключите Pro через «+» внизу справа
        </p>
      </div>

      <ServicesTabFab ariaLabel={copy.fabLabel} onClick={onConnectPro} />
    </div>
  );
}
