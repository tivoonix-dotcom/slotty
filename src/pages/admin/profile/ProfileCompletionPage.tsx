import { Link, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiCheckCircle, HiSparkles } from 'react-icons/hi2';
import { ADMIN_PATH } from '../../../app/paths';
import { buildProfileCompletionHref } from './profileCompletionNavigation';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

const PROFILE_COMPLETE_IMAGE_SRC = '/photos/SUCCE.webp';

function CircularProgress({ percent, loading }: { percent: number; loading: boolean }) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[168px] w-[168px] items-center justify-center">
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
          stroke="url(#completion-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="completion-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6f88" />
            <stop offset="100%" stopColor="#ff5f7a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] font-black tabular-nums tracking-[-0.06em] text-[#111827]">
          {loading ? '…' : `${percent}%`}
        </span>
      </div>
    </div>
  );
}

function SectionRow({
  label,
  done,
  href,
}: {
  label: string;
  done: boolean;
  href: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_2px_14px_rgba(17,24,39,0.04)] ring-1 ring-[#F3F4F6]">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
          done ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FFF1F4] text-[#ff5f7a]'
        }`}
        aria-hidden
      >
        {done ? <HiCheckCircle className="h-6 w-6" /> : <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f7a]" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#111827]">{label}</p>
        <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
          {done ? 'Готово' : 'Нужно заполнить'}
        </p>
      </div>

      {done ? (
        <span className="shrink-0 rounded-full bg-[#ECFDF3] px-3 py-1.5 text-[12px] font-bold text-[#16A34A]">
          ✓
        </span>
      ) : (
        <Link
          to={href}
          className="shrink-0 rounded-[12px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(255,95,122,0.28)] transition hover:opacity-95 active:scale-[0.98]"
        >
          Заполнить
        </Link>
      )}
    </div>
  );
}

export function ProfileCompletionPage() {
  const navigate = useNavigate();
  const { sections, percent, isComplete, showLoading, doneCount, totalCount } =
    useProfileCompletionOverview();

  const remaining = sections.filter((s) => !s.done);

  return (
    <div className="w-full min-w-0 pb-8">
      <button
        type="button"
        onClick={() => navigate(ADMIN_PATH)}
        className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#6B7280] shadow-[0_2px_12px_rgba(17,24,39,0.06)] ring-1 ring-[#EEF0F5] transition hover:text-[#111827]"
      >
        <HiArrowLeft className="h-4 w-4" aria-hidden />
        К профилю
      </button>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_28px_rgba(17,24,39,0.06)] ring-1 ring-[#F3F4F6]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF5F7] via-white to-[#FFF1F4] px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff5f7a]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-[#ff9aad]/15 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            {isComplete && !showLoading ? (
              <>
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold text-[#ff5f7a] ring-1 ring-[#FFE1E8]">
                  <HiSparkles className="h-4 w-4" aria-hidden />
                  Готово
                </span>
                <h1 className="max-w-md text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.05em] text-[#111827]">
                  Профиль успешно завершён
                </h1>
                <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">
                  Все разделы заполнены — клиенты видят полную карточку мастера.
                </p>
                <div className="mt-6 overflow-hidden rounded-[20px] ring-1 ring-[#FFE1E8]">
                  <img
                    src={PROFILE_COMPLETE_IMAGE_SRC}
                    alt=""
                    width={640}
                    height={360}
                    decoding="async"
                    className="block w-full max-w-[320px] object-cover"
                  />
                </div>
              </>
            ) : (
              <>
                <h1 className="max-w-md text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.05em] text-[#111827]">
                  Заполните профиль до конца
                </h1>
                <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">
                  Осталось {Math.max(0, totalCount - doneCount)} из {totalCount} разделов — это повысит доверие и
                  конверсию в запись.
                </p>
              </>
            )}

            <div className="mt-8">
              <CircularProgress percent={percent} loading={showLoading} />
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="px-1 text-[13px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            {remaining.length > 0 ? 'Что осталось' : 'Все разделы'}
          </h2>

          {sections.map((section) => (
            <SectionRow
              key={section.id}
              label={section.label}
              done={section.done}
              href={buildProfileCompletionHref(section.target)}
            />
          ))}
        </div>

        {isComplete && !showLoading ? (
          <div className="border-t border-[#F3F4F6] px-4 py-5 sm:px-6">
            <Link
              to={ADMIN_PATH}
              className="flex w-full items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98]"
            >
              Открыть профиль
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
