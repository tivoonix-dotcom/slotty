import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiHeart, HiShare } from 'react-icons/hi2';

type Props = {
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  favoriteDisabled?: boolean;
};

const iconBtn =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6B7280] shadow-[0_4px_18px_rgba(17,24,39,0.08)] transition active:scale-95';

export function MasterProfileHeader({
  isFavorite,
  onFavoriteToggle,
  onShare,
  favoriteDisabled = false,
}: Props) {
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-lg items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Назад"
        className={iconBtn}
      >
        <HiArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex gap-2">
        <button type="button" onClick={onShare} aria-label="Поделиться" className={iconBtn}>
          <HiShare className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onFavoriteToggle}
          disabled={favoriteDisabled}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={isFavorite}
          className={`${iconBtn} ${isFavorite ? 'text-[#F47C8C]' : ''} disabled:opacity-45`}
        >
          <HiHeart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </header>
  );
}
