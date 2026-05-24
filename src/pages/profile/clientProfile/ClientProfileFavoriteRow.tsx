import { Link } from 'react-router-dom';
import { HiChevronRight, HiXMark } from 'react-icons/hi2';
import { getMasterPath } from '../../../app/paths';
import type { FavoriteMasterDto } from '../../../features/profile/api/clientFavorites';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { catalogPanelRowClass, catalogPanelRowPad } from './clientProfileTheme';

type Props = {
  row: FavoriteMasterDto;
  onRemove: (id: string) => void;
  imagePriority?: boolean;
};

export function ClientProfileFavoriteRow({ row, onRemove, imagePriority }: Props) {
  const masterPath = getMasterPath(row.masterId);
  const ratingLabel =
    Number.isFinite(row.rating) && row.reviewsCount > 0
      ? `★ ${row.rating.toFixed(1)} · ${row.reviewsCount} отзывов`
      : row.reviewsCount > 0
        ? `${row.reviewsCount} отзывов`
        : 'Мастер';

  return (
    <li className={`${catalogPanelRowClass} ${catalogPanelRowPad}`}>
      <div className="flex items-center gap-3">
        <Link to={masterPath} className="flex min-w-0 flex-1 items-center gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[#EBEBEB]">
            {row.photoUrl ? (
              <ImageReveal
                src={optimizeAvatarUrl(row.photoUrl, 128)}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
                loading={imagePriority ? 'eager' : 'lazy'}
                fetchPriority={imagePriority ? 'high' : 'low'}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#9CA3AF]">
                {row.displayName.trim().charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#111827]">{row.displayName}</p>
            <p className="mt-0.5 truncate text-[14px] font-medium text-[#6B7280]">{ratingLabel}</p>
          </div>
          <HiChevronRight className="mr-1 h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(row.masterId)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[#9CA3AF] transition hover:bg-[#F5F5F5] hover:text-[#374151]"
          aria-label="Убрать из избранного"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}
