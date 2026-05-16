import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiClock,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { appointmentStatusLabel } from '../../../features/master/model/demoMasterAppointments';
import {
  overviewCard,
  overviewCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import type { ClientAnalytics, ReputationAnalytics, RevenueAnalytics } from './overviewAnalytics';
import { formatAppointmentWhenRu, formatBynRu } from './overviewFormat';
import {
  OverviewBarChart,
  OverviewEmptyState,
  OverviewHeroEmpty,
  OverviewLineChart,
  OverviewMetricCard,
  OverviewSectionCard,
  OverviewStatRow,
  OverviewWideMetricCard,
} from './OverviewSharedUi';

type SummaryProps = {
  metrics: {
    totalRevenue: number;
    totalVisits: number;
    nearest: import('../../../features/master/model/demoMasterAppointments').DemoMasterAppointment | null;
    hasAny: boolean;
  };
  serviceCount: number;
  appointmentsPath: string;
  dayStats: OverviewDayStat[];
  onOpenNearest: () => void;
};

export function OverviewSummaryPanel({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  onOpenNearest,
}: SummaryProps) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const hasAny = metrics.hasAny || totalRevenue > 0 || totalVisits > 0;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

  return (
    <div className="space-y-4">
      {!hasAny ? <OverviewHeroEmpty /> : null}

      <OverviewWideMetricCard
        icon={<HiWallet className="h-7 w-7" aria-hidden />}
        label="Доход за период"
        value={formatBynRu(totalRevenue)}
        sub={hasAny ? 'Общая сумма активных и завершённых записей' : 'Пока данных за период нет'}
      />

      <div className="grid grid-cols-3 gap-2.5">
        <OverviewMetricCard
          icon={<HiCalendar className="h-5 w-5" aria-hidden />}
          label="Записей"
          value={String(totalVisits)}
          sub="за период"
        />

        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Услуг"
          value={String(serviceCount)}
          sub="в каталоге"
        />

        <OverviewMetricCard
          icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
          label="Средний"
          value={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
          sub="чек"
        />
      </div>

      <section className={`${overviewCard} ${overviewCardPad}`}>
        {nearest ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
                <HiClock className="h-6 w-6" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#F47C8C]">Ближайшая запись</p>
                <p className="mt-1 text-[21px] font-bold tracking-[-0.05em] text-[#111827]">
                  {formatAppointmentWhenRu(nearest.date, nearest.time)}
                </p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">{nearest.clientName}</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">{nearest.serviceTitle}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C]">
                    {formatBynRu(nearest.priceByn)}
                  </span>

                  <span className="rounded-full bg-[#F7F7F8] px-3 py-1 text-[12px] font-bold text-[#6B7280]">
                    {appointmentStatusLabel(nearest.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenNearest}
                className={`flex min-h-12 items-center justify-center text-[14px] font-bold ${overviewPinkBtn}`}
              >
                Открыть
              </button>

              <Link
                to={appointmentsPath}
                className="flex min-h-12 items-center justify-center rounded-[18px] bg-[#F7F7F8] text-[14px] font-bold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.98]"
              >
                Все записи
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
              <HiBell className="h-6 w-6" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">
                Ближайших записей нет
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                Новые записи появятся здесь.
              </p>
            </div>
          </div>
        )}
      </section>

      <OverviewSectionCard
        title="Динамика записей"
        subtitle="Как менялось количество записей за выбранный период"
        icon={<HiCalendar className="h-5 w-5" aria-hidden />}
      >
        <OverviewLineChart stats={dayStats} mode="visits" emptyHint="Записей за период нет" />
      </OverviewSectionCard>
    </div>
  );
}

export function OverviewRevenuePanel({ data }: { data: RevenueAnalytics }) {
  if (!data.hasRevenue && data.unpaidCount === 0) {
    return (
      <div className="space-y-4">
        <OverviewEmptyState
          icon={<HiWallet className="h-7 w-7" aria-hidden />}
          title="Дохода пока нет"
          text="Когда появятся оплаченные записи, здесь будет график дохода и финансовая аналитика."
        />

        <OverviewSectionCard
          title="Что будет здесь"
          subtitle="После первых оплат появится вся финансовая картина"
          icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
        >
          <div className="divide-y divide-[#EAECEF]">
            <OverviewStatRow label="Доход по дням" value="0 BYN" />
            <OverviewStatRow label="Средний чек" value="0 BYN" />
            <OverviewStatRow label="Оплачено" value="0 BYN" />
          </div>
        </OverviewSectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OverviewWideMetricCard
        icon={<HiBanknotes className="h-7 w-7" aria-hidden />}
        label="Доход за период"
        value={formatBynRu(data.totalRevenue)}
        sub="Сумма завершённых и оплаченных записей"
        badge={
          data.completedCount > 0 ? (
            <span className="inline-flex rounded-full bg-[#ECFDF3] px-3 py-1 text-[12px] font-bold text-[#22C55E]">
              {data.completedCount} завершённых
            </span>
          ) : null
        }
      />

      <OverviewSectionCard
        title="График дохода"
        subtitle="Динамика дохода по дням"
        icon={<HiWallet className="h-5 w-5" aria-hidden />}
      >
        <OverviewLineChart
          stats={data.dayStats}
          mode="revenue"
          emptyHint="Дохода за период нет"
        />

        {data.chartIsTruncated ? (
          <p className="mt-3 text-[11px] leading-snug text-[#9CA3AF]">
            График показывает последние 90 дней, суммы считаются за весь выбранный период.
          </p>
        ) : null}
      </OverviewSectionCard>

      <div className="grid grid-cols-2 gap-2.5">
        <OverviewMetricCard
          icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
          label="Средний чек"
          value={data.completedCount > 0 ? formatBynRu(data.avgCheck) : '0 BYN'}
          sub="за запись"
        />

        <OverviewMetricCard
          icon={<HiWallet className="h-5 w-5" aria-hidden />}
          label="Оплачено"
          value={formatBynRu(data.paidAmount)}
          sub={`${data.paidCount} записей`}
        />
      </div>

      <OverviewSectionCard
        title="Детализация"
        subtitle="Разделение дохода по статусам"
        icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
      >
        <div className="divide-y divide-[#EAECEF]">
          <OverviewStatRow
            label="Средний чек"
            value={data.completedCount > 0 ? formatBynRu(data.avgCheck) : '0 BYN'}
            hint="оценка по завершённым записям"
          />

          <OverviewStatRow
            label="Оплачено"
            value={formatBynRu(data.paidAmount)}
            hint={`${data.paidCount} завершённых`}
          />

          <OverviewStatRow
            label="Не оплачено"
            value={formatBynRu(data.unpaidAmount)}
            hint={`${data.unpaidCount} ожидают визита`}
          />
        </div>
      </OverviewSectionCard>

      <OverviewSectionCard
        title="Доход по дням"
        subtitle="Столбчатая детализация выбранного периода"
        icon={<HiCalendar className="h-5 w-5" aria-hidden />}
      >
        <OverviewBarChart stats={data.dayStats} mode="revenue" emptyHint="Дохода за период нет" />
      </OverviewSectionCard>
    </div>
  );
}

export function OverviewClientsPanel({ data }: { data: ClientAnalytics }) {
  if (!data.hasData) {
    return (
      <div className="space-y-4">
        <OverviewEmptyState
          icon={<HiUsers className="h-7 w-7" aria-hidden />}
          title="Клиентов пока нет"
          text="Новые клиенты появятся здесь после первых записей."
        />

        <OverviewSectionCard
          title="Клиентская аналитика"
          subtitle="Здесь будут новые, повторные и постоянные клиенты"
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <OverviewMetricCard
              icon={<HiUsers className="h-5 w-5" aria-hidden />}
              label="Новые"
              value="0"
              sub="за период"
            />

            <OverviewMetricCard
              icon={<HiUsers className="h-5 w-5" aria-hidden />}
              label="Повторные"
              value="0"
              sub="за период"
            />
          </div>
        </OverviewSectionCard>
      </div>
    );
  }

  const totalShown = Math.max(data.newClients + data.repeatClients, 1);
  const newPercent = Math.round((data.newClients / totalShown) * 100);
  const repeatPercent = 100 - newPercent;

  return (
    <div className="space-y-4">
      <OverviewWideMetricCard
        icon={<HiUsers className="h-7 w-7" aria-hidden />}
        label="Всего клиентов"
        value={String(data.totalClients)}
        sub="Уникальные клиенты за выбранный период"
      />

      <div className="grid grid-cols-2 gap-2.5">
        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Новые"
          value={String(data.newClients)}
          sub="первый визит"
        />

        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Повторные"
          value={String(data.repeatClients)}
          sub="возвращаются"
        />
      </div>

      <OverviewSectionCard
        title="Динамика клиентов"
        subtitle="Активность записей по дням"
        icon={<HiCalendar className="h-5 w-5" aria-hidden />}
      >
        <OverviewLineChart
          stats={data.visitsPerDay}
          mode="visits"
          emptyHint="Клиентов за период нет"
        />
      </OverviewSectionCard>

      <OverviewSectionCard
        title="Тип клиентов"
        subtitle="Соотношение новых и повторных клиентов"
        icon={<HiUsers className="h-5 w-5" aria-hidden />}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#111827]">
              <span>Новые</span>
              <span>{newPercent}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#F47C8C]"
                style={{ width: `${newPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#111827]">
              <span>Повторные</span>
              <span>{repeatPercent}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#A78BFA]"
                style={{ width: `${repeatPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-[18px] bg-[#FFF1F4] p-4">
            <p className="text-[14px] font-bold text-[#111827]">Клиенты — основа роста</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">
              Чем больше повторных клиентов, тем стабильнее доход мастера.
            </p>
          </div>
        </div>
      </OverviewSectionCard>
    </div>
  );
}

type ReputationExtra = Partial<{
  totalReviews: number;
  newReviews: number;
  unansweredReviews: number;
}>;

function RatingStars({ value }: { value: number }) {
  const rounded = Math.round(value);

  return (
    <div className="flex items-center gap-0.5 text-[#FBBF24]">
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar
          key={i}
          className={`h-5 w-5 ${i <= rounded ? 'opacity-100' : 'opacity-25'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function OverviewReputationPanel({ data }: { data: ReputationAnalytics }) {
  const extra = data as ReputationAnalytics & ReputationExtra;

  if (!data.hasReviews) {
    return (
      <div className="space-y-4">
        <OverviewEmptyState
          icon={<HiStar className="h-7 w-7" aria-hidden />}
          title="Отзывов пока нет"
          text="После первых отзывов здесь появится рейтинг мастера и аналитика репутации."
        />

        <OverviewSectionCard
          title="Репутация"
          subtitle="Здесь будут рейтинг, новые отзывы и отзывы без ответа"
          icon={<HiStar className="h-5 w-5" aria-hidden />}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <OverviewMetricCard
              icon={<HiStar className="h-5 w-5" aria-hidden />}
              label="Рейтинг"
              value="Новый"
              sub="пока нет оценок"
            />

            <OverviewMetricCard
              icon={<HiStar className="h-5 w-5" aria-hidden />}
              label="Отзывы"
              value="0"
              sub="за всё время"
            />
          </div>
        </OverviewSectionCard>
      </div>
    );
  }

  const average = data.averageRating ?? 0;
  const totalReviews =
    typeof extra.totalReviews === 'number' ? String(extra.totalReviews) : 'Есть';
  const newReviews = typeof extra.newReviews === 'number' ? String(extra.newReviews) : '0';
  const unanswered = typeof extra.unansweredReviews === 'number' ? String(extra.unansweredReviews) : '0';

  return (
    <div className="space-y-4">
      <OverviewWideMetricCard
        icon={<HiStar className="h-7 w-7" aria-hidden />}
        label="Средний рейтинг"
        value={average > 0 ? average.toFixed(1) : 'Новый'}
        sub="На основе отзывов клиентов"
        badge={average > 0 ? <RatingStars value={average} /> : null}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <OverviewMetricCard
          icon={<HiStar className="h-5 w-5" aria-hidden />}
          label="Всего отзывов"
          value={totalReviews}
          sub="за всё время"
        />

        <OverviewMetricCard
          icon={<HiStar className="h-5 w-5" aria-hidden />}
          label="Новые"
          value={newReviews}
          sub="за период"
        />
      </div>

      <OverviewSectionCard
        title="Отзывы без ответа"
        subtitle="Ответы помогают повышать доверие клиентов"
        icon={<HiBell className="h-5 w-5" aria-hidden />}
      >
        <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#FAFAFA] p-4">
          <div>
            <p className="text-[28px] font-bold tracking-[-0.06em] text-[#111827]">
              {unanswered}
            </p>
            <p className="mt-1 text-[13px] text-[#6B7280]">ожидают ответа</p>
          </div>

          <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C]">
            Репутация
          </span>
        </div>
      </OverviewSectionCard>

      <OverviewSectionCard
        title="Динамика рейтинга"
        subtitle="Как меняется доверие клиентов"
        icon={<HiStar className="h-5 w-5" aria-hidden />}
      >
        <div className="rounded-[20px] bg-[#FAFAFA] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] font-bold text-[#111827]">Текущий рейтинг</p>
            <p className="text-[18px] font-bold text-[#F47C8C]">
              {average > 0 ? average.toFixed(1) : 'Новый'}
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F9A8B4] to-[#F47C8C]"
              style={{ width: `${Math.min(100, Math.max(0, (average / 5) * 100))}%` }}
            />
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-[#6B7280]">
            Чем выше рейтинг и быстрее ответы на отзывы, тем больше доверия у новых клиентов.
          </p>
        </div>
      </OverviewSectionCard>
    </div>
  );
}