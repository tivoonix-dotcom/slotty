import { Link } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi2';
import { ADMIN_PATH } from '../../../app/paths';
import { buildProfileCompletionHref } from './profileCompletionNavigation';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

function ProgressCircle({ percent }: { percent: number }) {
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length - (percent / 100) * length;

  return (
    <div className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFE8EE"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ff5f7a"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-[32px] font-black tabular-nums tracking-[-0.06em] text-[#111827]">
          {percent}%
        </p>
        <p className="text-[11px] font-bold text-[#9CA3AF]">готово</p>
      </div>
    </div>
  );
}

export function ProfileCompletionPage() {
  const { sections, percent, doneCount, totalCount, isComplete } =
    useProfileCompletionOverview();

  return (
    <div className="w-full min-w-0 pb-10">
      <header className="flex flex-col gap-6 border-b border-[#EEF0F5] pb-8 lg:flex-row lg:items-center lg:gap-10">
        <ProgressCircle percent={percent} />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[#ff5f7a]">
            {doneCount} из {totalCount} разделов заполнено
          </p>
          <h1 className="mt-2 text-[28px] font-black tracking-[-0.05em] text-[#111827] lg:text-[36px]">
            {isComplete ? 'Профиль заполнен на 100%' : 'Заполните профиль до конца'}
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6B7280]">
            {isComplete
              ? 'Все основные данные готовы. Профиль готов для клиентов.'
              : 'Дозаполните разделы ниже — так профиль выглядит профессиональнее.'}
          </p>
        </div>

        <Link
          to={ADMIN_PATH}
          className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-[#ff5f7a] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]"
        >
          Открыть профиль
        </Link>
      </header>

      <ul className="mt-2 divide-y divide-[#EEF0F5]">
        {sections.map((section) => (
          <li
            key={section.id}
            className="flex items-center gap-3 py-4 sm:gap-4 sm:py-5"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                section.done ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FFF1F4] text-[#ff5f7a]'
              }`}
              aria-hidden
            >
              {section.done ? (
                <HiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#111827]">{section.label}</p>
              <p className="mt-0.5 text-[13px] text-[#6B7280]">
                {section.done ? 'Раздел заполнен' : section.description}
              </p>
            </div>

            {section.done ? (
              <span className="shrink-0 text-[13px] font-semibold text-[#16A34A]">Готово</span>
            ) : (
              <Link
                to={buildProfileCompletionHref(section.target)}
                className="shrink-0 text-[13px] font-semibold text-[#ff5f7a] transition hover:text-[#e84d68]"
              >
                Заполнить
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
