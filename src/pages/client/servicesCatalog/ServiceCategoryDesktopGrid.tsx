import { Link } from 'react-router-dom';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import { getServiceCategoryPath, SERVICES_PATH } from '../../../app/paths';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  catalogDesktopChipActive,
  catalogDesktopChipIdle,
  catalogDesktopSectionLabel,
} from './servicesCatalogTheme';

type Props = {
  categories: ServiceCategoryDto[];
  activeCode?: string | null;
};

export function ServiceCategoryDesktopGrid({ categories, activeCode }: Props) {
  if (!categories.length) return null;

  const chipClass = (on: boolean) =>
    `flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-[14px] font-semibold transition ${
      on ? catalogDesktopChipActive : catalogDesktopChipIdle
    }`;

  return (
    <nav className="space-y-3" aria-label="Категории услуг">
      <p className={catalogDesktopSectionLabel}>Категории</p>
      <div className="flex flex-col gap-1.5">
        <Link to={SERVICES_PATH} className={chipClass(activeCode == null)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[12px] font-bold text-[#F47C8C]">
            Все
          </span>
          <span>Все услуги</span>
        </Link>
        {categories.map((cat) => {
          const on = categoryCodesMatch(activeCode, cat.code);
          const imageSrc = getCategoryWorkPhotoUrl(cat.code || cat.name);
          return (
            <Link
              key={cat.code}
              to={getServiceCategoryPath(cat.code)}
              className={chipClass(on)}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] bg-[#EEEEF0]">
                <ImageReveal src={imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
              <span className="min-w-0 truncate">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
