import { type ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiCalendar,
  HiCheckCircle,
  HiUserGroup,
  HiUserPlus,
  HiUsers,
} from 'react-icons/hi2';
import type { ClientAnalytics } from './overviewAnalytics';
import {
  OVERVIEW_CLIENTS_FOOTER_SRC,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';
import {
  OverviewClientsDynamicsChart,
  OverviewEmptyState,
} from './OverviewSharedUi';

const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getClientPercents(newClients: number, repeatClients: number) {
  const total = Math.max(newClients + repeatClients, 1);
  const newPercent = Math.round((newClients / total) * 100);
  const repeatPercent = 100 - newPercent;

  return {
    newPercent,
    repeatPercent,
  };
}

function SoftIcon({
  children,
  tone = 'pink',
}: {
  children: ReactNode;
  tone?: 'pink' | 'violet' | 'green';
}) {
  const toneClass =
    tone === 'violet'
      ? 'bg-[#F5F3FF] text-[#A78BFA]'
      : tone === 'green'
        ? 'bg-[#ECFDF3] text-[#22C55E]'
        : 'bg-[#FFF1F4] text-[#ff5f7a]';

  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${toneClass}`}>
      {children}
    </span>
  );
}

function ClientsMetricsCarousel({
  newClients,
  repeatClients,
  totalClients,
}: {
  newClients: number;
  repeatClients: number;
  totalClients: number;
}) {
  return (
    <OverviewKpiCarousel>
      <OverviewKpiStatCard
        surface="carousel"
        label="Новые"
        value={String(newClients)}
        hint="Клиенты с первым визитом"
        icon={<HiUserPlus className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Повторные"
        value={String(repeatClients)}
        hint="Клиенты, которые возвращаются"
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Всего"
        value={String(totalClients)}
        hint="Уникальных клиентов"
        icon={<HiCheckCircle className="h-5 w-5" aria-hidden />}
      />
    </OverviewKpiCarousel>
  );
}

function PercentLine({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  tone: 'pink' | 'violet';
}) {
  const barClass = tone === 'pink' ? 'bg-[#ff5f7a]' : 'bg-[#A78BFA]';
  const bgClass = tone === 'pink' ? 'bg-[#FFE8EE]' : 'bg-[#F5F3FF]';
  const textClass = tone === 'pink' ? 'text-[#ff5f7a]' : 'text-[#A78BFA]';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-black text-[#111827]">{label}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#9CA3AF]">
            {value} клиентов
          </p>
        </div>

        <span className={`text-[18px] font-black tracking-[-0.04em] ${textClass}`}>
          {percent}%
        </span>
      </div>

      <div className={`h-3 overflow-hidden rounded-full ${bgClass}`}>
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-500`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  );
}

function ClientsHeroCard({
  data,
  embedded = false,
}: {
  data: ClientAnalytics;
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? `relative overflow-hidden ${SLOTTY_GRADIENT} p-6 text-white lg:p-8`
          : `relative overflow-hidden rounded-[32px] ${SLOTTY_GRADIENT} p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8`
      }
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          <HiUsers className="h-4 w-4" aria-hidden />
          Клиенты за период
        </p>

        <p className="mt-8 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] text-white lg:text-[72px]">
          {data.totalClients}
        </p>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          Уникальные клиенты за выбранный период. Здесь видно, кто пришёл впервые,
          а кто уже возвращается к вам повторно.
        </p>
      </div>
    </section>
  );
}

function ClientsEmptyHero({ embedded = false }: { embedded?: boolean }) {
  return (
    <section
      className={
        embedded
          ? `relative overflow-hidden ${SLOTTY_GRADIENT} p-6 text-white lg:p-8`
          : `relative overflow-hidden rounded-[32px] ${SLOTTY_GRADIENT} p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8`
      }
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff5f7a]/20 blur-3xl" />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black text-white">
          <HiUsers className="h-4 w-4" aria-hidden />
          Клиентская база
        </p>

        <h1 className="mt-8 text-[42px] font-black leading-none tracking-[-0.08em] text-white lg:text-[64px]">
          Клиентов пока нет
        </h1>

        <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/82">
          Когда появятся первые записи, здесь будет понятная аналитика по новым
          и повторным клиентам.
        </p>
      </div>
    </section>
  );
}

function ClientsHeroShell({
  data,
  children,
}: {
  data: ClientAnalytics;
  children?: ReactNode;
}) {
  return (
    <div className={`overflow-hidden ${overviewDesktopCard}`}>
      <ClientsHeroCard data={data} embedded />
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function ClientsBalanceCard({
  newClients,
  repeatClients,
}: {
  newClients: number;
  repeatClients: number;
}) {
  const { newPercent, repeatPercent } = getClientPercents(newClients, repeatClients);

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Тип клиентов
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Помогает понять, насколько клиенты возвращаются.
          </p>
        </div>

        <SoftIcon>
          <HiUserGroup className="h-6 w-6" aria-hidden />
        </SoftIcon>
      </div>

      <div className="space-y-6">
        <PercentLine
          label="Новые клиенты"
          value={newClients}
          percent={newPercent}
          tone="pink"
        />

        <PercentLine
          label="Повторные клиенты"
          value={repeatClients}
          percent={repeatPercent}
          tone="violet"
        />
      </div>

      <div className="mt-6 rounded-[20px] bg-[#f6f7fb] p-5">
        <p className="text-[14px] font-black text-[#111827]">Что важно смотреть?</p>
        <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
          Если повторных клиентов становится больше — значит, профиль, качество услуг
          и запись работают хорошо.
        </p>
      </div>
    </section>
  );
}

function ClientsDynamicsSection({
  clientsPerDay,
  chartIsTruncated,
}: {
  clientsPerDay: ClientAnalytics['clientsPerDay'];
  chartIsTruncated: boolean;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Динамика клиентов
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Новые и повторные клиенты по дням.
          </p>
        </div>

        <span className={`${overviewIconCircle} h-11 w-11 shrink-0 rounded-[18px]`}>
          <HiCalendar className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <OverviewClientsDynamicsChart stats={clientsPerDay} />

      {chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за весь выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function ClientsTrustCard() {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
      <div className="flex items-start gap-3">
        <SoftIcon tone="green">
          <HiCheckCircle className="h-6 w-6" aria-hidden />
        </SoftIcon>

        <div>
          <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827]">
            Клиенты возвращаются
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
            Повторные записи — главный показатель доверия к мастеру.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] bg-[#f6f7fb] p-4">
        <img
          src={OVERVIEW_CLIENTS_FOOTER_SRC}
          alt=""
          decoding="async"
          className="mx-auto max-h-[220px] w-full object-contain object-center"
        />
      </div>
    </section>
  );
}

function EmptyClientsPanel({ data }: { data: ClientAnalytics }) {
  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden lg:space-y-6">
      <div className={`overflow-hidden ${overviewDesktopCard}`}>
        <ClientsEmptyHero embedded />
        <div className="bg-white px-3 pb-4 pt-1 sm:px-4">
          <ClientsMetricsCarousel newClients={0} repeatClients={0} totalClients={0} />
        </div>
      </div>

      <OverviewEmptyState
        icon={<HiUsers className="h-7 w-7" aria-hidden />}
        title="Клиентов пока нет"
        text="Новые клиенты появятся здесь после первых записей."
      />

      <ClientsDynamicsSection
        clientsPerDay={data.clientsPerDay}
        chartIsTruncated={data.chartIsTruncated}
      />
    </div>
  );
}

export function OverviewClientsPanel({ data }: { data: ClientAnalytics }) {
  if (!data.hasData) {
    return <EmptyClientsPanel data={data} />;
  }

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden lg:space-y-6">
      <ClientsHeroShell data={data}>
        <ClientsMetricsCarousel
          newClients={data.newClients}
          repeatClients={data.repeatClients}
          totalClients={data.totalClients}
        />
      </ClientsHeroShell>

      <ClientsDynamicsSection
        clientsPerDay={data.clientsPerDay}
        chartIsTruncated={data.chartIsTruncated}
      />

      <section className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <ClientsBalanceCard
          newClients={data.newClients}
          repeatClients={data.repeatClients}
        />

        <ClientsTrustCard />
      </section>
    </div>
  );
}
