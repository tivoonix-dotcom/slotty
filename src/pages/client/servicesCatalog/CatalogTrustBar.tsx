import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { catalogDesktopPanel } from './servicesCatalogTheme';

const catalogTrustIconsDir = `/photos/categories/`;

const ITEMS = [
  {
    image: `${catalogTrustIconsDir}1.webp`,
    label: 'Проверенные мастера',
    subtitle: 'Профили, отзывы и рейтинг',
  },
  {
    image: `${catalogTrustIconsDir}2.webp`,
    label: 'Быстрая запись',
    subtitle: 'Без долгих переписок',
  },
  {
    image: `${catalogTrustIconsDir}3.webp`,
    label: 'Бесплатная отмена',
    subtitle: 'Если планы изменились',
  },
  {
    image: `${catalogTrustIconsDir}4.webp`,
    label: 'Оплата у мастера',
    subtitle: 'Онлайн — позже',
  },
] as const;

export function CatalogTrustBar() {
  return (
    <div className={`${catalogDesktopPanel} mt-4 overflow-hidden`}>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 [scrollbar-width:none] xl:grid xl:grid-cols-4 xl:gap-0 xl:overflow-visible xl:p-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ image, label, subtitle }, index) => (
          <li
            key={label}
            className={`flex min-w-[11.5rem] shrink-0 snap-start flex-col items-center gap-2 rounded-[14px] px-3 py-4 text-center sm:min-w-[12.5rem] xl:min-w-0 xl:rounded-none xl:px-5 xl:py-5 ${
              index < ITEMS.length - 1 ? 'xl:border-r xl:border-[#EEEEEE]' : ''
            }`}
          >
            <ImageReveal
              src={image}
              alt=""
              className="h-[4.25rem] w-[4.25rem] object-contain sm:h-[4.75rem] sm:w-[4.75rem] xl:h-[5.5rem] xl:w-[5.5rem]"
              loading="lazy"
            />
            <div className="space-y-0.5">
              <p className="text-[13px] font-bold leading-snug text-[#111827] sm:text-[14px]">{label}</p>
              <p className="text-[11px] font-medium leading-snug text-[#8E8E93] sm:text-[12px]">{subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
