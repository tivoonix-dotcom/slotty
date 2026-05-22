import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi2';
import { ADMIN_PATH } from '../../../app/paths';
import { buildProfileCompletionHref } from './profileCompletionNavigation';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

function ProgressCircle({ percent }: { percent: number }) {
  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length - (percent / 100) * length;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
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
        <div className="text-[38px] font-black tracking-[-0.06em] text-[#111827]">
          {percent}%
        </div>
        <div className="text-[12px] font-bold text-[#9CA3AF]">готово</div>
      </div>
    </div>
  );
}

export function ProfileCompletionPage() {
  const { sections, percent, doneCount, totalCount, isComplete } =
    useProfileCompletionOverview();

  return (
    <main className="w-full bg-[#f6f7fb] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-[1180px]">
        <section className="mb-8 rounded-[32px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.06)] lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[180px_1fr_auto]">
            <ProgressCircle percent={percent} />

            <div>
              <p className="mb-3 inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-[13px] font-bold text-[#ff5f7a]">
                {doneCount} из {totalCount} разделов заполнено
              </p>

              <h1 className="text-[32px] font-black tracking-[-0.05em] text-[#111827] lg:text-[42px]">
                {isComplete ? 'Профиль заполнен на 100%' : 'Заполните профиль до конца'}
              </h1>

              <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-[#6B7280]">
                {isComplete
                  ? 'Все основные данные готовы. Профиль выглядит аккуратно и готов для клиентов.'
                  : 'Заполните недостающие разделы, чтобы профиль выглядел доверительно и профессионально.'}
              </p>
            </div>

            <Link
              to={ADMIN_PATH}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff5f7a] px-6 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(255,95,122,0.25)] transition hover:bg-[#f04f6c]"
            >
              Открыть профиль
              <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center gap-4 rounded-[24px] bg-white p-5 shadow-[0_10px_36px_rgba(17,24,39,0.05)]"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  section.done
                    ? 'bg-[#ECFDF3] text-[#22C55E]'
                    : 'bg-[#FFF1F4] text-[#ff5f7a]'
                }`}
              >
                {section.done ? (
                  <HiCheckCircle className="h-7 w-7" />
                ) : (
                  <HiExclamationCircle className="h-7 w-7" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-extrabold text-[#111827]">
                  {section.label}
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
                  {section.done ? 'Раздел заполнен' : section.description}
                </p>
              </div>

              {section.done ? (
                <span className="rounded-full bg-[#ECFDF3] px-3 py-1.5 text-[12px] font-bold text-[#16A34A]">
                  Готово
                </span>
              ) : (
                <Link
                  to={buildProfileCompletionHref(section.target)}
                  className="shrink-0 rounded-2xl bg-[#FFF1F4] px-4 py-2 text-[13px] font-bold text-[#ff5f7a] transition hover:bg-[#FFE1E8]"
                >
                  Заполнить
                </Link>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}