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
  servicesDesktopCard,
  SLOTTY_GRADIENT,
} from './adminServicesTheme';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  tab: ServicesTabId;
  metrics: ServicesTabMetrics;
};

function HeroShell({
  children,
  hero,
}: {
  children: ReactNode;
  hero: ReactNode;
}) {
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
    <section className={`relative overflow-hidden ${SLOTTY_GRADIENT} p-6 text-white lg:p-8`}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          {badgeIcon}
          {badge}
        </p>

        <p className="mt-8 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:text-[72px]">
          {value}
        </p>

        <p className="mt-3 text-[15px] font-bold text-white/80">{subtitle}</p>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          {description}
        </p>

        {action ? <div className="mt-6">{action}</div> : null}
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
          value={m.avgPrice > 0 ? `${m.avgPrice} BYN` : '—'}
          hint="По всем услугам"
          icon={<HiWallet className="h-5 w-5" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function PriceHero({ metrics }: { metrics: ServicesTabMetrics['price'] }) {
  const m = metrics;
  const range =
    m.total > 0 && m.minPrice !== m.maxPrice
      ? `${m.minPrice}–${m.maxPrice} BYN`
      : m.total > 0
        ? `${m.minPrice} BYN`
        : '—';

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
          value={m.avgPrice > 0 ? `${m.avgPrice} BYN` : '—'}
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

export function ServicesDesktopHero({ tab, metrics }: Props) {
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
