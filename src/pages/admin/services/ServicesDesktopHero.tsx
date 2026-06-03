import type { ReactNode } from 'react';
import {
  HiClipboardDocumentList,
  HiEye,
  HiEyeSlash,
  HiGift,
  HiLockClosed,
  HiReceiptPercent,
  HiScissors,
  HiSquares2X2,
  HiWallet,
} from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { OverviewKpiCarousel, OverviewKpiStatCard } from '../overview/OverviewKpiBlocks';
import {
  formatOptionalByn,
  formatOptionalPriceRange,
  EMPTY_METRIC,
} from '../../../shared/lib/emptyDisplayText';
import { servicesDesktopCard, SLOTTY_GRADIENT } from './adminServicesTheme';
import { MASTER_PRO_PLAN_NAME, servicesProUpsellCopy } from './servicesProUpsell';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  tab: ServicesTabId;
  metrics: ServicesTabMetrics;
  /** Free: на вкладках наборов/акций — без счётчиков «0 активных», только пояснение Pro. */
  extrasLocked?: boolean;
};

function HeroShell({ children, hero }: { children: ReactNode; hero: ReactNode }) {
  return (
    <div className={`overflow-hidden ${servicesDesktopCard}`}>
      {hero}
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function HeroBlock({
  badgeIcon,
  badge,
  value,
  subtitle,
  description,
  action,
}: {
  badgeIcon: ReactNode;
  badge: string;
  value: string;
  subtitle: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden ${SLOTTY_GRADIENT} p-5 text-white lg:p-8`}>
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff8aa0]/35 blur-3xl lg:-right-20 lg:-top-20 lg:h-72 lg:w-72"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-[#ff5f7a]/20 blur-3xl lg:-bottom-24 lg:-left-20 lg:h-64 lg:w-64"
        aria-hidden
      />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-black text-white lg:px-4 lg:py-2 lg:text-[14px]">
          {badgeIcon}
          {badge}
        </p>

        <p className="mt-5 text-[32px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:mt-8 lg:text-[52px] xl:text-[72px]">
          {value}
        </p>

        <p className="mt-2 text-[13px] font-bold text-white/80 lg:mt-3 lg:text-[15px]">{subtitle}</p>

        <p className="mt-3 max-w-[660px] text-[14px] font-semibold leading-relaxed text-white/82 lg:mt-6 lg:text-[17px] lg:leading-8">
          {description}
        </p>

        {action ? <div className="mt-4 lg:mt-6">{action}</div> : null}
      </div>
    </section>
  );
}

function CatalogHero({ metrics }: { metrics: ServicesTabMetrics['catalog'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiSquares2X2 className="h-4 w-4" aria-hidden />}
          badge="Каталог услуг"
          value={String(m.total)}
          subtitle={m.total === 1 ? '1 услуга в каталоге' : `${m.total} услуг в каталоге`}
          description="Добавляйте услуги, настраивайте цену и видимость — клиенты увидят их при записи и в поиске."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Услуг в каталоге"
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Видимые"
          value={String(m.visible)}
          hint="Доступны для записи"
          icon={<HiEye className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Скрытые"
          value={String(m.hidden)}
          hint="Не показываются клиентам"
          icon={<HiEyeSlash className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Средняя цена"
          value={formatOptionalByn(m.avgPrice)}
          hint="По всем услугам"
          icon={<HiWallet className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function PriceHero({ metrics }: { metrics: ServicesTabMetrics['price'] }) {
  const m = metrics;
  const range = formatOptionalPriceRange(m.minPrice, m.maxPrice, m.total);

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiClipboardDocumentList className="h-4 w-4" aria-hidden />}
          badge="Прайс-лист"
          value={m.avgPrice > 0 ? `${m.avgPrice} BYN` : '0 BYN'}
          subtitle="Средняя цена по каталогу"
          description="Быстро меняйте цену и длительность — клиенты сразу увидят обновления при записи."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Позиций в прайсе"
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Средняя"
          value={formatOptionalByn(m.avgPrice)}
          hint="По каталогу"
          icon={<HiWallet className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Видимых"
          value={String(m.visible)}
          hint="Открыты для записи"
          icon={<HiEye className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Диапазон"
          value={range}
          hint="Минимум и максимум"
          icon={<HiClipboardDocumentList className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function BundlesHero({ metrics }: { metrics: ServicesTabMetrics['bundles'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiGift className="h-4 w-4" aria-hidden />}
          badge="Наборы услуг"
          value={String(m.total)}
          subtitle={m.total === 1 ? '1 набор' : `${m.total} наборов`}
          description="Соберите несколько услуг в одно предложение со скидкой — клиент видит выгоду, вы повышаете средний чек."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Наборов создано"
          icon={<HiGift className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Опубликовано"
          value={String(m.published)}
          hint="Видны клиентам"
          icon={<HiEye className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Черновики"
          value={String(m.drafts)}
          hint="Ещё не опубликованы"
          icon={<HiEyeSlash className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="В каталоге"
          value={String(m.catalogServices)}
          hint="Услуг для наборов"
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function ProLockedExtrasHero({ tab }: { tab: 'bundles' | 'promotions' }) {
  const isPromos = tab === 'promotions';
  const copy = servicesProUpsellCopy(tab);
  const badge = isPromos ? 'Акции' : 'Наборы услуг';

  return (
    <HeroShell
      hero={
        <section className="bg-[#F6F7FB] p-5 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#6B7280] ring-1 ring-[#E5E7EB]">
                <HiLockClosed className="h-4 w-4 text-[#ff5f7a]" aria-hidden />
                {badge} · только с {MASTER_PRO_PLAN_NAME}
              </p>
              <p className="mt-4 text-[22px] font-black tracking-[-0.04em] text-[#111827] lg:text-[28px]">
                Сейчас на тарифе Free
              </p>
              <p className="mt-2 max-w-[36rem] text-[15px] font-semibold leading-relaxed text-[#6B7280]">
                {copy.lead}
              </p>
            </div>
            <Link
              to={ADMIN_BILLING_PATH}
              className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-[14px] bg-[#ff5f7a] px-5 text-[14px] font-bold text-white transition hover:bg-[#f04f6c] active:scale-[0.98]"
            >
              {copy.cta}
            </Link>
          </div>
        </section>
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Тариф"
          value="Free"
          hint={`Нужен ${MASTER_PRO_PLAN_NAME}`}
          icon={<HiLockClosed className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label={isPromos ? 'Акции' : 'Наборы'}
          value="0"
          hint="Создадите после Pro"
          icon={isPromos ? <HiReceiptPercent className="h-5 w-5" aria-hidden /> : <HiGift className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Каталог"
          value={EMPTY_METRIC}
          hint="Услуги доступны на Free"
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function PromotionsHero({ metrics }: { metrics: ServicesTabMetrics['promotions'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          badgeIcon={<HiReceiptPercent className="h-4 w-4" aria-hidden />}
          badge="Акции"
          value={String(m.active)}
          subtitle="Активных акций сейчас"
          description="Запускайте скидки и спецпредложения с датами начала и окончания — они показываются в каталоге и при записи."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Все акции"
          icon={<HiReceiptPercent className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Активные"
          value={String(m.active)}
          hint="Действуют сейчас"
          icon={<HiEye className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Запланированные"
          value={String(m.scheduled)}
          hint="Скоро начнутся"
          icon={<HiClipboardDocumentList className="h-5 w-5" aria-hidden />}
        />
        <OverviewKpiStatCard
          surface="carousel"
          label="Черновики"
          value={String(m.drafts)}
          hint="Не опубликованы"
          icon={<HiEyeSlash className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

export function ServicesDesktopHero({ tab, metrics, extrasLocked = false }: Props) {
  if (extrasLocked && tab === 'bundles') {
    return <ProLockedExtrasHero tab="bundles" />;
  }
  if (extrasLocked && tab === 'promotions') {
    return <ProLockedExtrasHero tab="promotions" />;
  }

  switch (tab) {
    case 'price':
      return <PriceHero metrics={metrics.price} />;
    case 'bundles':
      return <BundlesHero metrics={metrics.bundles} />;
    case 'promotions':
      return <PromotionsHero metrics={metrics.promotions} />;
    default:
      return <CatalogHero metrics={metrics.catalog} />;
  }
}
