import { Link } from 'react-router-dom';
import { HiArrowLeft, HiFlag, HiHeart, HiShare } from 'react-icons/hi2';
import { SERVICES_PATH } from '../../../app/paths';

type Props = {
  masterName?: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onReport?: () => void;
  favoriteDisabled?: boolean;
  actionSize?: 'sm' | 'md';
  /** Hero ушёл вверх — белый фон toolbar и имя по центру. */
  heroCollapsed?: boolean;
};

export function MasterProfileToolbarInner({
  masterName,
  isFavorite,
  onFavoriteToggle,
  onShare,
  onReport,
  favoriteDisabled = false,
  actionSize = 'sm',
  heroCollapsed = false,
}: Props) {
  const overlay = !heroCollapsed;
  const btnClass =
    actionSize === 'md'
      ? overlay
        ? 'flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/20 text-white backdrop-blur-[2px] transition hover:bg-white/30'
        : 'flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]'
      : overlay
        ? 'flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/20 text-white backdrop-blur-[2px] transition hover:bg-white/30'
        : 'flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]';
  const iconClass = actionSize === 'md' ? 'h-5 w-5' : 'h-[18px] w-[18px]';
  const showCenterTitle = heroCollapsed && Boolean(masterName?.trim());

  return (
    <div className="relative flex w-full min-h-[52px] items-center justify-between gap-3">
      <Link
        to={SERVICES_PATH}
        className={`relative z-10 inline-flex min-h-9 min-w-0 max-w-[42%] shrink items-center gap-1.5 text-[14px] font-semibold transition sm:max-w-none ${
          overlay
            ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] hover:text-white'
            : 'text-[#6B7280] hover:text-[#111827]'
        }`}
      >
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">К мастерам</span>
      </Link>

      {masterName?.trim() ? (
        <p
          className={`pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-[min(52vw,16rem)] -translate-x-1/2 -translate-y-1/2 truncate px-2 text-center text-[15px] font-bold tracking-[-0.02em] text-[#111827] transition-opacity duration-300 xl:max-w-[20rem] xl:text-[16px] ${
            showCenterTitle ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!showCenterTitle}
        >
          {masterName.trim()}
        </p>
      ) : null}

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        {onReport ? (
          <button type="button" onClick={onReport} aria-label="Пожаловаться на профиль" className={btnClass}>
            <HiFlag className={iconClass} />
          </button>
        ) : null}
        <button type="button" onClick={onShare} aria-label="Поделиться" className={btnClass}>
          <HiShare className={iconClass} />
        </button>
        <button
          type="button"
          onClick={onFavoriteToggle}
          disabled={favoriteDisabled}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={isFavorite}
          className={`${btnClass} disabled:opacity-45 ${isFavorite ? (overlay ? 'text-white' : 'text-[#F47C8C]') : ''}`}
        >
          <HiHeart
            className={`${iconClass} ${actionSize === 'md' ? 'translate-x-px' : ''} ${isFavorite ? 'fill-current' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
