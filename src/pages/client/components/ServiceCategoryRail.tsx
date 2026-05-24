import { Link } from 'react-router-dom';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import { getServiceCategoryPath, SERVICES_PATH } from '../../../app/paths';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  categories: ServiceCategoryDto[];
  activeCode?: string | null;
  /** Показать плитку «Все категории» (ведёт на список услуг). */
  showAllLink?: boolean;
};

export function ServiceCategoryRail({ categories, activeCode, showAllLink }: Props) {
  if (!categories.length) return null;

  return (
    <div className="-mx-1 flex items-center gap-2.5 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {showAllLink ? (
        <Link
          to={SERVICES_PATH}
          className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2 transition active:scale-[0.97]"
        >
          <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-[#FFF1F4] shadow-[0_2px_10px_rgba(17,24,39,0.06)]">
            <span className="text-[11px] font-bold text-[#F47C8C]">Все</span>
          </span>
          <span className="max-w-full truncate px-0.5 text-center text-[11px] font-semibold leading-tight text-[#374151]">
            Все категории
          </span>
        </Link>
      ) : null}
      {categories.map((cat) => {
        const on = categoryCodesMatch(activeCode, cat.code);
        const imageSrc = getCategoryWorkPhotoUrl(cat.code || cat.name);
        return (
          <Link
            key={cat.code}
            to={getServiceCategoryPath(cat.code)}
            className={`flex w-[4.75rem] shrink-0 flex-col items-center gap-2 transition active:scale-[0.97] ${
              on ? 'opacity-100' : 'opacity-95'
            }`}
          >
            <span
              className={`relative block h-14 w-14 overflow-hidden rounded-[18px] shadow-[0_2px_10px_rgba(17,24,39,0.06)] ${
                on ? 'shadow-[0_4px_16px_rgba(244,124,140,0.18)]' : ''
              }`}
            >
              <ImageReveal
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <span
              className={`max-w-full truncate px-0.5 text-center text-[11px] font-semibold leading-tight ${
                on ? 'text-[#F47C8C]' : 'text-[#374151]'
              }`}
            >
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
