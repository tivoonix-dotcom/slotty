import { Link } from 'react-router-dom';
import { HiArrowRight, HiCheckCircle } from 'react-icons/hi2';
import { ADMIN_PROFILE_COMPLETION_PATH } from '../../../app/paths';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

type Props = {
  /** Компактная карточка для шапки; полная — для узких колонок. */
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

  return (
    <Link
      to={ADMIN_PROFILE_COMPLETION_PATH}
      title="Заполненность профиля"
      className={`group block overflow-hidden rounded-[20px] bg-white no-underline shadow-[0_8px_28px_rgba(255,95,122,0.12)] ring-1 ring-[#FFE1E8] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(255,95,122,0.18)] ${
        isHeader ? 'max-w-[min(100%,20rem)] min-w-[12.5rem] shrink-0' : 'w-full'
      } ${className}`.trim()}
    >
      <div className={`relative ${isHeader ? 'px-3 py-2.5' : 'p-4'}`}>
        {!isHeader ? (
          <>
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff5f7a]/10 blur-2xl" />
            <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-[#ff9aad]/15 blur-2xl" />
          </>
        ) : (
          <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#ff5f7a]/10 blur-xl" />
        )}

        <div className="relative flex items-center gap-2.5">
          <div
            className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5f7a] to-[#ff8aa0] text-white shadow-[0_8px_20px_rgba(255,95,122,0.3)] ${
              isHeader ? 'h-10 w-10' : 'h-12 w-12'
            }`}
          >
            {completed ? (
              <HiCheckCircle className={isHeader ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
            ) : (
              <span className={`font-black ${isHeader ? 'text-[12px]' : 'text-[14px]'}`}>
                {completionLoading ? '…' : `${completionPercent}%`}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-extrabold text-[#111827] ${
                isHeader ? 'text-[12px]' : 'text-[13px]'
              }`}
            >
              Профиль заполнен
            </p>
            <p className={`font-semibold text-[#ff5f7a] ${isHeader ? 'text-[10px]' : 'text-[11px]'}`}>
              {completionLoading ? 'Загрузка…' : `${completionPercent}% готово`}
            </p>
          </div>

          <HiArrowRight
            className={`shrink-0 text-[#ff5f7a] transition group-hover:translate-x-0.5 ${
              isHeader ? 'h-4 w-4' : 'h-5 w-5'
            }`}
            aria-hidden
          />
        </div>

        <div
          className={`relative overflow-hidden rounded-full bg-[#FFE8EE] ${
            isHeader ? 'mt-2 h-1.5' : 'mt-3 h-2'
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff5f7a] to-[#ff8aa0] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {!isHeader ? (
          <p className="relative mt-2 text-[11px] leading-snug text-[#6B7280]">
            Нажми, чтобы посмотреть, какие разделы уже готовы.
          </p>
        ) : null}
      </div>
    </Link>
  );
}
