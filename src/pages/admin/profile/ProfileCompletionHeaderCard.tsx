import { Link } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi2';
import { ADMIN_PROFILE_COMPLETION_PATH } from '../../../app/paths';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

type Props = {
  /** Минимальный вид для шапки; полный — для отдельной полосы на mobile. */
  variant?: 'header' | 'full';
  className?: string;
};

export function ProfileCompletionHeaderCard({ variant = 'header', className = '' }: Props) {
  const {
    percent: completionPercent,
    showLoading: completionLoading,
    isComplete: profileComplete,
  } = useProfileCompletionOverview();

  const completed = profileComplete ?? (!completionLoading && completionPercent >= 100);
  const isHeader = variant === 'header';
  const percentLabel = completionLoading ? '…' : `${completionPercent}%`;

  if (isHeader) {
    return (
      <Link
        to={ADMIN_PROFILE_COMPLETION_PATH}
        title="Заполненность профиля"
        className={`inline-flex min-w-0 max-w-[11rem] flex-col gap-1 rounded-lg px-1 py-0.5 no-underline transition hover:opacity-80 active:scale-[0.98] sm:max-w-[13rem] ${className}`.trim()}
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-[12px] font-semibold text-[#6B7280] sm:text-[13px]">
            Профиль
          </span>
          <span className="shrink-0 tabular-nums text-[13px] font-bold text-[#ff5f7a] sm:text-[14px]">
            {completed ? (
              <span className="inline-flex items-center gap-0.5">
                <HiCheckCircle className="h-3.5 w-3.5" aria-hidden />
                {percentLabel}
              </span>
            ) : (
              percentLabel
            )}
          </span>
        </span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-[#FFE8EE]">
          <span
            className="block h-full rounded-full bg-[#ff5f7a] transition-[width] duration-500"
            style={{ width: completionLoading ? '0%' : `${completionPercent}%` }}
          />
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={ADMIN_PROFILE_COMPLETION_PATH}
      title="Заполненность профиля"
      className={`block w-full rounded-[22px] bg-white p-4 no-underline shadow-[0_14px_40px_rgba(255,95,122,0.14)] ring-1 ring-[#FFE1E8] transition hover:-translate-y-0.5 ${className}`.trim()}
    >
      <div className="relative">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff5f7a]/10 blur-2xl" />
        <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-[#ff9aad]/15 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5f7a] to-[#ff8aa0] text-white shadow-[0_10px_24px_rgba(255,95,122,0.35)]">
            {completed ? (
              <HiCheckCircle className="h-7 w-7" aria-hidden />
            ) : (
              <span className="text-[14px] font-black">{percentLabel}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-[#111827]">Профиль заполнен</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ff5f7a]">
              {completionLoading ? 'Загрузка…' : `${completionPercent}% готово`}
            </p>
          </div>
        </div>

        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[#FFE8EE]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff5f7a] to-[#ff8aa0] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <p className="relative mt-2 text-[11px] leading-snug text-[#6B7280]">
          Нажми, чтобы посмотреть, какие разделы уже готовы.
        </p>
      </div>
    </Link>
  );
}
