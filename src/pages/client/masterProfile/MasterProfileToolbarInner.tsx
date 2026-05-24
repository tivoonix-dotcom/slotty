import { Link } from 'react-router-dom';
import { HiArrowLeft, HiHeart, HiShare } from 'react-icons/hi2';
import { MASTERS_PATH } from '../../../app/paths';

type Props = {
  masterName?: string;
  compact?: boolean;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  favoriteDisabled?: boolean;
  actionSize?: 'sm' | 'md';
};

export function MasterProfileToolbarInner({
  masterName,
  compact = false,
  isFavorite,
  onFavoriteToggle,
  onShare,
  favoriteDisabled = false,
  actionSize = 'sm',
}: Props) {
  const btnClass =
    actionSize === 'md'
      ? 'flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]'
      : 'flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]';
  const iconClass = actionSize === 'md' ? 'h-5 w-5' : 'h-[18px] w-[18px]';

  return (
    <div className="flex w-full min-h-[52px] items-center justify-between gap-3">
      <Link
        to={MASTERS_PATH}
        className="inline-flex min-h-9 min-w-0 shrink items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]"
      >
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className={compact ? 'hidden sm:inline' : undefined}>К мастерам</span>
      </Link>

      {compact && masterName ? (
        <p className="min-w-0 flex-1 truncate px-2 text-center text-[15px] font-bold text-[#111827] lg:text-[16px]">
          {masterName}
        </p>
      ) : (
        <span className="flex-1" aria-hidden />
      )}

      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onShare} aria-label="Поделиться" className={btnClass}>
          <HiShare className={iconClass} />
        </button>
        <button
          type="button"
          onClick={onFavoriteToggle}
          disabled={favoriteDisabled}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={isFavorite}
          className={`${btnClass} disabled:opacity-45 ${isFavorite ? 'text-[#F47C8C]' : ''}`}
        >
          <HiHeart
            className={`${iconClass} ${actionSize === 'md' ? 'translate-x-px' : ''} ${isFavorite ? 'fill-current' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
