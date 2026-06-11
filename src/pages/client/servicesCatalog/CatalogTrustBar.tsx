import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { catalogDesktopPanel } from './servicesCatalogTheme';

const catalogTrustIconsDir = `/photos/categories/`;

const ITEMS = [
  {
    image: `${catalogTrustIconsDir}1.webp`,
    label: 'Проверенные мастера',
    subtitle: 'Профили, отзывы и рейтинг',
    tone: 'bg-[#FFF1F4]',
  },
  {
    image: `${catalogTrustIconsDir}2.webp`,
    label: 'Быстрая запись',
    subtitle: 'Без долгих переписок',
    tone: 'bg-[#FFF7ED]',
  },
  {
    image: `${catalogTrustIconsDir}3.webp`,
    label: 'Бесплатная отмена',
    subtitle: 'Если планы изменились',
    tone: 'bg-[#ECFDF5]',
  },
  {
    image: `${catalogTrustIconsDir}4.webp`,
    label: 'Оплата у мастера',
    subtitle: 'Онлайн — позже',
    tone: 'bg-[#EFF6FF]',
  },
] as const;

export function CatalogTrustBar() {
  return (
    <div className={`${catalogDesktopPanel} mt-4 overflow-hidden shadow-[0_2px_14px_rgba(17,24,39,0.04)]`}>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 [scrollbar-width:none] xl:grid xl:grid-cols-4 xl:gap-0 xl:overflow-visible xl:p-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ image, label, subtitle, tone }, index) => (
          <li
            key={label}
            className={`flex min-w-[11.5rem] shrink-0 snap-start flex-col items-center gap-2 rounded-[14px] px-3 py-4 text-center sm:min-w-[12.5rem] xl:min-w-0 xl:rounded-none xl:px-5 xl:py-5 ${
              index < ITEMS.length - 1 ? 'xl:border-r xl:border-[#EEEEEE]' : ''
            }`}
          >
            <span
              className={`flex h-[5.75rem] w-[5.75rem] items-center justify-center rounded-[18px] sm:h-24 sm:w-24 xl:h-[6.75rem] xl:w-[6.75rem] ${tone}`}
            >
              <ImageReveal
                src={image}
                alt=""
                className="h-[4.25rem] w-[4.25rem] object-contain sm:h-[4.75rem] sm:w-[4.75rem] xl:h-[5.5rem] xl:w-[5.5rem]"
                loading="lazy"
              />
            </span>
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
