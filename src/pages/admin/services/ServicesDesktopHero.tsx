import type { ReactNode } from 'react';
import {
  HiClipboardDocumentList,
  HiEye,
  HiEyeSlash,
  HiGift,
  HiReceiptPercent,
  HiScissors,
  HiSquares2X2,
  HiWallet,
} from 'react-icons/hi2';
import { OverviewKpiCarousel, OverviewKpiStatCard } from '../overview/OverviewKpiBlocks';
import {
  formatOptionalByn,
  formatOptionalPriceRange,
} from '../../../shared/lib/emptyDisplayText';
import { useTabIntroImage } from '../useTabIntroImage';
import { servicesDesktopCard, servicesTabHeroBg } from './adminServicesTheme';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

const SERVICES_TAB_HERO_BG: Record<ServicesTabId, string> = {
  catalog: servicesTabHeroBg('11.webp'),
  price: servicesTabHeroBg('22.webp'),
  bundles: servicesTabHeroBg('33.webp'),
  promotions: servicesTabHeroBg('44.webp'),
};

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
  tab,
  badgeIcon,
  badge,
  value,
  subtitle,
  description,
  action,
}: {
  tab: ServicesTabId;
  badgeIcon: ReactNode;
  badge: string;
  value: string;
  subtitle: string;
  description: string;
  action?: ReactNode;
}) {
  const backgroundSrc = useTabIntroImage(SERVICES_TAB_HERO_BG[tab]);

  return (
    <section className="relative overflow-hidden p-5 text-white lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundSrc})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

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
          tab="catalog"
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
          tab="price"
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
          tab="bundles"
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

function PromotionsHero({ metrics }: { metrics: ServicesTabMetrics['promotions'] }) {
  const m = metrics;

  return (
    <HeroShell
      hero={
        <HeroBlock
          tab="promotions"
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
  if (extrasLocked && (tab === 'bundles' || tab === 'promotions')) {
    return null;
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
