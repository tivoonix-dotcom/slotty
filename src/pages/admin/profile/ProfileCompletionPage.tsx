import { Link } from 'react-router-dom';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi2';
import { ADMIN_PATH } from '../../../app/paths';
import { buildProfileCompletionHref } from './profileCompletionNavigation';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';
import {
  PROFILE_COMPLETION_HERO_BG,
  profileCompletionDoneBadge,
  profileCompletionHeroOverlay,
  profileCompletionHeroPanel,
  profileCompletionList,
  profileCompletionMetaChip,
  profileCompletionPanel,
  profileCompletionPrimaryBtn,
  profileCompletionRowPad,
  profileCompletionSecondaryBtn,
  profileCompletionSectionLabel,
} from './adminProfileCompletionTheme';

function ProgressCircle({ percent }: { percent: number }) {
  const size = 112;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length - (percent / 100) * length;

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-28 w-28 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F47C8C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-[28px] font-bold tracking-[-0.04em] text-[#111827] sm:text-[32px]">
          {percent}%
        </div>
        <div className={profileCompletionSectionLabel}>готово</div>
      </div>
    </div>
  );
}

export function ProfileCompletionPage() {
  const { sections, percent, doneCount, totalCount, isComplete } =
    useProfileCompletionOverview();

  return (
    <div className="w-full min-w-0 space-y-4 lg:space-y-5">
      <section className={profileCompletionHeroPanel}>
        <div
          className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${PROFILE_COMPLETION_HERO_BG})` }}
          aria-hidden
        />
        <div className={profileCompletionHeroOverlay} aria-hidden />

        <div className={`relative z-10 ${profileCompletionRowPad} lg:py-6`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <ProgressCircle percent={percent} />

            <div className="min-w-0 flex-1">
              <p className={`mb-3 ${profileCompletionMetaChip}`}>
                {doneCount} из {totalCount} разделов заполнено
              </p>

              <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[26px] lg:text-[28px]">
                {isComplete ? 'Профиль заполнен на 100%' : 'Заполните профиль до конца'}
              </h1>

              <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-[#6B7280] sm:text-[15px] sm:leading-7">
                {isComplete
                  ? 'Все основные данные готовы. Профиль выглядит аккуратно и готов для клиентов.'
                  : 'Заполните недостающие разделы, чтобы профиль выглядел доверительно и профессионально.'}
              </p>
            </div>

            <Link to={ADMIN_PATH} className={profileCompletionPrimaryBtn}>
              Открыть профиль
            </Link>
          </div>
        </div>
      </section>

      <section className={`${profileCompletionPanel} ${profileCompletionList}`}>
        {sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center gap-4 ${profileCompletionRowPad} transition hover:bg-[#FAFAFA]`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                section.done ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FFF1F4] text-[#F47C8C]'
              }`}
            >
              {section.done ? (
                <HiCheckCircle className="h-5 w-5" aria-hidden />
              ) : (
                <HiExclamationCircle className="h-5 w-5" aria-hidden />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-[#111827]">{section.label}</h3>
              <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">
                {section.done ? 'Раздел заполнен' : section.description}
              </p>
            </div>

            {section.done ? (
              <span className={profileCompletionDoneBadge}>Готово</span>
            ) : (
              <Link
                to={buildProfileCompletionHref(section.target)}
                className={profileCompletionSecondaryBtn}
              >
                Заполнить
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
