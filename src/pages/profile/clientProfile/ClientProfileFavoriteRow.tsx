import { Link } from 'react-router-dom';
import { HiHeart, HiStar } from 'react-icons/hi2';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { FavoriteMasterDto } from '../../../features/profile/api/clientFavorites';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { MasterCardPortrait } from '../../client/components/MasterCardPortrait';
import {
  catalogListCardClass,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from '../../client/servicesCatalog/servicesCatalogTheme';

type Props = {
  row: FavoriteMasterDto;
  onRemove: (id: string) => void;
  imagePriority?: boolean;
};

function FavoriteRating({ row }: { row: FavoriteMasterDto }) {
  const hasRating = row.rating > 0;
  const hasReviews = row.reviewsCount > 0;

  if (!hasReviews && !hasRating) {
    return <p className="mt-1 text-[13px] font-semibold text-[#F47C8C]">Новый мастер</p>;
  }

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-medium text-[#6B7280]">
      {hasRating ? (
        <span className="inline-flex items-center gap-0.5 font-semibold text-[#111827]">
          <HiStar className="h-4 w-4 text-[#F59E0B]" aria-hidden />
          {row.rating.toFixed(1)}
        </span>
      ) : null}
      {hasReviews ? <span>{formatReviewsCountLabel(row.reviewsCount)}</span> : <span>нет отзывов</span>}
    </p>
  );
}

export function ClientProfileFavoriteRow({ row, onRemove, imagePriority }: Props) {
  const masterPath = getMasterPath(row.masterId);
  const bookingPath = getBookingPath(row.masterId);

  return (
    <li>
      <article className={`${catalogListCardClass} ring-1 ring-[#EEEEEE]`}>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:p-5">
          <Link to={masterPath} className="flex min-w-0 flex-1 items-center gap-4 no-underline">
            <MasterCardPortrait
              masterName={row.displayName}
              photoUrl={row.photoUrl}
              className="relative h-[5.5rem] w-[5.5rem] shrink-0"
              imageClassName="h-full w-full rounded-[20px] object-cover"
              loading={imagePriority ? 'eager' : 'lazy'}
              photoMaxEdge={128}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-bold leading-snug tracking-[-0.02em] text-[#111827] lg:text-[20px]">
                {row.displayName}
              </h3>
              <FavoriteRating row={row} />
            </div>
          </Link>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <Link to={masterPath} className={`${catalogSecondaryBtn} min-w-[7.5rem] no-underline`}>
              Профиль
            </Link>
            <Link to={bookingPath} className={`${catalogPrimaryBtn} min-w-[7.5rem] no-underline`}>
              Записаться
            </Link>
            <button
              type="button"
              onClick={() => onRemove(row.masterId)}
              aria-label="Убрать из избранного"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C] transition hover:bg-[#FFE8EE] active:scale-95"
            >
              <HiHeart className="h-5 w-5 fill-current" aria-hidden />
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}
