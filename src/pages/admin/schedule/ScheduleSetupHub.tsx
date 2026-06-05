import { Link } from 'react-router-dom';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { ScheduleWindowsHintBanner } from '../shared/ScheduleWindowsHintBanner';
import { scheduleAccentBtn } from './adminScheduleTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';

type Props = {
  onAddToday: () => void;
  onCreateWeek: () => void;
  onCreateMonth: () => void;
  onCreateFromSchedule: () => void;
};

function QuickCard({
  title,
  cta,
  onClick,
  accent,
  imageSrc,
}: {
  title: string;
  cta: string;
  onClick?: () => void;
  accent?: boolean;
  imageSrc: string;
}) {
  const shellClass = [
    'group relative flex h-full min-h-[10.5rem] w-full min-w-0 overflow-hidden rounded-[16px] text-left',
    'transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(17,24,39,0.12)] active:scale-[0.995]',
    'sm:min-h-[11.5rem]',
    accent ? 'ring-2 ring-inset ring-[#3B4CCA]/35' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={imageSrc}
          alt=""
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover object-center brightness-[0.78] transition-transform duration-500 will-change-transform group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-[#0f172a]/52" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/92 via-[#0f172a]/62 to-[#0f172a]/38" />
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <p className="px-4 pt-3.5 text-[18px] font-black leading-tight tracking-[-0.03em] text-white sm:px-4 sm:pt-4 sm:text-[20px]">
          {title}
        </p>
        <div
          className={`mt-auto flex min-h-11 w-full items-center justify-center border-t px-3 backdrop-blur-[2px] sm:min-h-12 ${
            accent
              ? 'border-[#3B4CCA]/35 bg-[#3B4CCA]/88'
              : 'border-white/10 bg-[#111827]/82'
          }`}
        >
          <span className="text-[13px] font-bold leading-none text-white sm:text-[14px]">
            {cta} →
          </span>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shellClass}>
        {body}
      </button>
    );
  }

  return <div className={shellClass}>{body}</div>;
}

export function ScheduleQuickSetup({
  onAddToday,
  onCreateWeek,
  onCreateMonth,
  onCreateFromSchedule,
}: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-bold text-[#111827]">Быстрая настройка</h3>

      </div>
      <div className="grid grid-cols-2 items-stretch gap-2.5 [&>*]:min-w-0 lg:grid-cols-4">
        <QuickCard
          title="На сегодня"
          cta="Добавить окно"
          onClick={onAddToday}
          imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.today}
        />
        <QuickCard
          title="На неделю"
          cta="Создать неделю"
          onClick={onCreateWeek}
          imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.week}
        />
        <QuickCard
          title="На месяц"
          cta="Создать месяц"
          onClick={onCreateMonth}
          accent
          imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.month}
        />
        <QuickCard
          title="Из графика"
          cta="Создать из графика"
          onClick={onCreateFromSchedule}
          imageSrc={SCHEDULE_QUICK_SETUP_IMAGES.fromSchedule}
        />
      </div>
      <Link to={`${ADMIN_SCHEDULE_PATH}?tab=calendar`} className="text-[13px] font-semibold text-[#3B4CCA]">
        Открыть календарь →
      </Link>
    </section>
  );
}

export function ScheduleMentalModelCard({
  activeSlotCount,
  onCreateFirst,
  hideEmptyHint = false,
}: {
  activeSlotCount: number;
  onCreateFirst: () => void;
  hideEmptyHint?: boolean;
}) {
  return (
    <ScheduleWindowsHintBanner variant="schedule">
      {!hideEmptyHint && activeSlotCount <= 0 ? (
        <button
          type="button"
          onClick={onCreateFirst}
          className={scheduleAccentBtn}
        >
          Создать первые окна
        </button>
      ) : null}
    </ScheduleWindowsHintBanner>
  );
}
