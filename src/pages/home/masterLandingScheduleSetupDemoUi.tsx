import type { FC, ReactNode } from 'react';
import {
  HiCalendarDays,
  HiClock,
  HiInformationCircle,
  HiPlusCircle,
  HiRectangleStack,
  HiScissors,
  HiSparkles,
} from 'react-icons/hi2';
import { ADMIN_SEGMENT_NAV_MOBILE } from '../admin/adminCabinetLayout';
import { adminMobileSegmentTabClass } from '../admin/shared/adminMobileTabBarTheme';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabTextClass,
} from '../admin/shared/adminSectionTabsTheme';
import {
  SCHEDULE_KPI_TILE_BG,
  scheduleKpiTileOverlay,
} from '../admin/schedule/adminScheduleTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from '../admin/schedule/scheduleQuickSetupAssets';
import {
  SCHEDULE_WINDOWS_HINT_TEXT,
  SCHEDULE_WINDOWS_HINT_TITLE,
} from '../admin/shared/scheduleWindowsHintStorage';
import {
  masterDemoDesktopScrollClass,
  masterDemoMobileScrollClass,
} from './homeLandingMasterDemoTheme';
import { useLandingDemoLayout } from './masterLandingDemoShared';

type QuickCardProps = {
  title: string;
  cta: string;
  imageSrc: string;
  dataAttr?: string;
  pressed?: boolean;
  accent?: boolean;
};

function DemoQuickCard({ title, cta, imageSrc, dataAttr, pressed, accent }: QuickCardProps) {
  return (
    <div
      data-master-demo={dataAttr}
      className={[
        'relative flex min-h-[5.75rem] w-full min-w-0 overflow-hidden rounded-[10px] text-left sm:min-h-[6.25rem]',
        pressed ? 'scale-[0.98] ring-2 ring-inset ring-[#3B4CCA]/50' : '',
        accent ? 'ring-2 ring-inset ring-[#3B4CCA]/35' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          className="h-full w-full scale-105 object-cover object-center brightness-[0.78]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/96 via-[#0f172a]/45 via-55% to-[#0f172a]/20" />
      </div>
      <div className="relative z-10 flex h-full w-full flex-col">
        <p className="px-2 pt-2 text-[10px] font-black leading-tight tracking-[-0.03em] text-white sm:text-[11px]">
          {title}
        </p>
        <div
          className={`mt-auto flex min-h-7 w-full items-center justify-center px-2 backdrop-blur-[1px] sm:min-h-8 ${
            accent || pressed ? 'bg-[#3B4CCA]/88' : 'bg-[#111827]/82'
          }`}
        >
          <span className="text-[9px] font-bold leading-none text-white sm:text-[10px]">{cta} →</span>
        </div>
      </div>
    </div>
  );
}

function DemoStatChip({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="relative flex min-h-[4.25rem] flex-col justify-between overflow-hidden rounded-[10px] p-2 sm:min-h-[4.5rem] sm:p-2.5">
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCHEDULE_KPI_TILE_BG})` }}
        aria-hidden
      />
      <div className={scheduleKpiTileOverlay} aria-hidden />
      <div className="relative z-10 flex items-start justify-between gap-1">
        <p className="text-[8px] font-bold leading-tight text-[#374151] sm:text-[9px]">{label}</p>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white/85 ${
            accent ? 'text-[#3B4CCA]' : 'text-[#6B7280]'
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p
          className={`text-[18px] font-black tabular-nums leading-none tracking-[-0.06em] sm:text-[20px] ${
            accent ? 'text-[#3B4CCA]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        <p className="mt-0.5 text-[8px] font-semibold leading-snug text-[#4B5563] sm:text-[9px]">{hint}</p>
      </div>
    </div>
  );
}

const DEMO_TABS = [
  { id: 'create', label: 'Создать', Icon: HiPlusCircle },
  { id: 'calendar', label: 'Календарь', Icon: HiCalendarDays },
  { id: 'list', label: 'Список', Icon: HiRectangleStack },
] as const;

type MasterLandingScheduleCreateHubProps = {
  todayPressed?: boolean;
  scrollRef?: React.Ref<HTMLDivElement>;
};

export const MasterLandingScheduleCreateHub: FC<MasterLandingScheduleCreateHubProps> = ({
  todayPressed = false,
  scrollRef,
}) => {
  const { mobile } = useLandingDemoLayout();

  const scheduleTabs = (
    <>
      {DEMO_TABS.map((tab) => {
        const selected = tab.id === 'create';
        const Icon = tab.Icon;

        if (mobile) {
          return (
            <div key={tab.id} className={adminMobileSegmentTabClass(selected, 'schedule')}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="max-w-full truncate text-[9px] font-bold leading-none">{tab.label}</span>
            </div>
          );
        }

        return (
          <div
            key={tab.id}
            className={adminSectionTabTextClass(selected, 'schedule')
              .replace('h-full', 'h-8')
              .replace('lg:px-5', 'px-2')}
          >
            <Icon
              className={`${adminSectionTabIconClass.replace('h-5 w-5', 'h-3.5 w-3.5')} ${adminSectionTabIconToneClass(selected, 'schedule')}`}
              aria-hidden
            />
            <span className={`${adminSectionTabLabelClass.replace('text-[14px]', 'text-[10px]')} sm:text-[11px]`}>
              {tab.label}
            </span>
            {selected ? (
              <span
                className={adminSectionTabIndicatorClass('schedule').replace('inset-x-3', 'inset-x-2')}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </>
  );

  return (
  <div className="flex min-h-0 flex-1 flex-col">
    {!mobile ? (
      <nav className="flex h-8 shrink-0 border-b border-[#eef0f5] bg-white" aria-hidden>
        {scheduleTabs}
      </nav>
    ) : null}

    <div
      ref={scrollRef}
      className={`min-h-0 flex-1 ${mobile ? masterDemoMobileScrollClass : masterDemoDesktopScrollClass} px-2.5 pb-3 pt-2 sm:px-3 sm:pb-3.5 sm:pt-2.5`}
    >
      <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
        {!mobile ? (
          <header className="flex items-start justify-between gap-2">
            <h2 className="text-[12px] font-black tracking-[-0.04em] text-[#111827] sm:text-[13px]">
              Расписание
            </h2>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold text-[#3B4CCA] ring-1 ring-[#E0E4F8] sm:text-[9px]">
              Как видят клиенты
            </span>
          </header>
        ) : (
          <div className="flex justify-end">
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold text-[#3B4CCA] ring-1 ring-[#E0E4F8]">
              Как видят клиенты
            </span>
          </div>
        )}

        <article className="overflow-hidden rounded-[10px] bg-[#F5F5F5]" aria-hidden>
          <div className="p-2 sm:p-2.5">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF0FC] text-[#3B4CCA]">
                <HiInformationCircle className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold leading-snug text-[#111827] sm:text-[10px]">
                  {SCHEDULE_WINDOWS_HINT_TITLE}
                </p>
                <p className="mt-0.5 text-[8px] font-medium leading-snug text-[#6B7280] sm:text-[9px]">
                  {SCHEDULE_WINDOWS_HINT_TEXT}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex min-h-6 items-center rounded-[8px] bg-[#EEF0FC] px-2 text-[8px] font-semibold text-[#3B4CCA] sm:text-[9px]">
                Понятно
              </span>
              <span className="text-[8px] font-medium text-[#9CA3AF] sm:text-[9px]">Не показывать снова</span>
            </div>
          </div>
        </article>

        <section className="space-y-1.5">
          <h3 className="text-[10px] font-bold text-[#111827] sm:text-[11px]">Быстрая настройка</h3>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <DemoQuickCard
              title="На сегодня"
              cta="Добавить окно"
              imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.today}
              dataAttr="quick-today"
              pressed={todayPressed}
            />
            <DemoQuickCard
              title="На неделю"
              cta="Создать неделю"
              imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.week}
            />
            <DemoQuickCard
              title="На месяц"
              cta="Создать месяц"
              imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.month}
              accent
            />
            <DemoQuickCard
              title="Из графика"
              cta="Создать из графика"
              imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.fromSchedule}
            />
          </div>
          <p className="text-[9px] font-semibold text-[#3B4CCA] sm:text-[10px]">Открыть календарь →</p>
        </section>

        <section className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <DemoStatChip
            label="Шаблоны"
            value="2"
            hint="для быстрых окон"
            icon={<HiSparkles className="h-3 w-3" aria-hidden />}
            accent
          />
          <DemoStatChip
            label="Свободно"
            value="0"
            hint="окон впереди"
            icon={<HiClock className="h-3 w-3" aria-hidden />}
          />
          <DemoStatChip
            label="Всего окон"
            value="0"
            hint="в расписании"
            icon={<HiRectangleStack className="h-3 w-3" aria-hidden />}
          />
          <DemoStatChip
            label="Услуги"
            value="3"
            hint="в каталоге"
            icon={<HiScissors className="h-3 w-3" aria-hidden />}
          />
        </section>

        <section className="relative overflow-hidden rounded-[10px]">
          <img
            src={SCHEDULE_QUICK_SETUP_IMAGES.templatesBg}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
          />
          <div className="relative z-10 p-2 sm:p-2.5">
            <div className="flex w-full items-center justify-between gap-2 rounded-[8px] bg-white/95 px-2 py-2 ring-1 ring-white/80 sm:px-2.5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#111827] sm:text-[10px]">Шаблоны для быстрого создания</p>
                <p className="mt-0.5 text-[8px] leading-relaxed text-[#6B7280] sm:text-[9px]">
                  Шаблон помогает быстрее создать реальные окна.
                </p>
              </div>
              <span className="shrink-0 text-[8px] font-bold text-[#3B4CCA] sm:text-[9px]">Показать</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    {mobile ? (
      <nav
        className={`${ADMIN_SEGMENT_NAV_MOBILE} shrink-0`}
        style={{ minHeight: '2.75rem' }}
        aria-hidden
      >
        {scheduleTabs}
      </nav>
    ) : null}
  </div>
  );
};
