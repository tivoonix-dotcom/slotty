import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import {
  CLIENT_DESKTOP_SHELL_BLEED_CLASS,
  CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS,
} from '../shared/layout/clientShellLayout';
import { homeSection } from './home/homeTheme';

const CATEGORIES = [
  { key: 'manicure', label: 'Маникюр', image: '/photos/лендинг/каталог/маникюр.png' },
  { key: 'barbers', label: 'Барберы', image: '/photos/лендинг/каталог/барберы.png' },
  { key: 'brows-lashes', label: 'Брови и ресницы', image: '/photos/лендинг/каталог/брови.png' },
  { key: 'massage', label: 'Массаж', image: '/photos/лендинг/каталог/массаж.png' },
  { key: 'fitness', label: 'Фитнес', image: '/photos/лендинг/каталог/фитнес.png' },
  { key: 'tattoo', label: 'Тату', image: '/photos/лендинг/каталог/тату.png' },
] as const;

function categoryImageSrc(category: (typeof CATEGORIES)[number]): string {
  return category.image;
}

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section
      className={`${homeSection} !mt-12 sm:!mt-16`}
      style={{ animationDelay: '120ms' }}
      aria-labelledby="home-categories-heading"
    >
      <div className="mx-auto max-w-[40rem] text-center">
        <h2
          id="home-categories-heading"
          className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
        >
          Выберите услугу
        </h2>
      </div>

      <div
        className={`${CLIENT_DESKTOP_SHELL_BLEED_CLASS} mt-10 overflow-x-auto [scrollbar-width:none] sm:mt-14 [&::-webkit-scrollbar]:hidden`}
      >
        <ul
          className={`flex list-none snap-x snap-mandatory scroll-pl-6 gap-5 pb-2 xl:scroll-pl-10 sm:gap-6 ${CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS} pr-[max(1.25rem,env(safe-area-inset-right))]`}
        >
          {CATEGORIES.map((category, index) => (
            <li key={category.key} className="w-[min(17.5rem,82vw)] shrink-0 snap-start sm:w-[19.5rem]">
              <button
                type="button"
                onClick={() => onCategory(category.key)}
                aria-label={category.label}
                className="group block w-full transition active:opacity-95"
              >
                <div className="overflow-hidden rounded-[22px] bg-[#F2F2F2] p-3 sm:rounded-[26px] sm:p-4">
                  <ImageReveal
                    src={categoryImageSrc(category)}
                    alt=""
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index < 2 ? 'high' : 'low'}
                    draggable={false}
                    className="block h-auto w-full rounded-[18px] object-contain transition duration-500 group-hover:scale-[1.01] sm:rounded-[22px]"
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
