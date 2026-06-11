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
        className={`inline-flex min-w-0 items-center gap-1 whitespace-nowrap no-underline transition hover:opacity-80 active:scale-[0.98] ${className}`.trim()}
      >
        <span className="text-[11px] font-semibold text-[#6B7280]">Профиль</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums text-[12px] font-bold text-[#ff5f7a]">
          {completed ? <HiCheckCircle className="h-3 w-3 shrink-0" aria-hidden /> : null}
          {percentLabel}
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
