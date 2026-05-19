import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { homeSection, homeSectionTitle } from './home/homeTheme';

const CATEGORIES = [
  {
    key: 'manicure',
    label: 'Маникюр',
    image: '/photos/work/manicure.webp',
  },
  {
    key: 'barbers',
    label: 'Барберы',
    image: '/photos/work/barbers.webp',
  },
  {
    key: 'brows_lashes',
    label: 'Брови и ресницы',
    image: '/photos/work/brows_lashes.webp',
  },
  {
    key: 'massage',
    label: 'Массаж',
    image: '/photos/work/massage.webp',
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    image: '/photos/work/fitness.webp',
  },
  {
    key: 'tattoo',
    label: 'Тату',
    image: '/photos/work/tattoo.webp',
  },
];

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section className={homeSection} style={{ animationDelay: '120ms' }}>
      <div className="mb-4 px-0.5 text-center sm:text-left">
        <h2 className={homeSectionTitle}>Что ищем?</h2>
      </div>

      <div className="rounded-[28px] bg-[#F1EFEF] px-3 py-4 shadow-[0_8px_28px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((category, index) => (
            <button
              key={category.key}
              type="button"
              onClick={() => onCategory(category.key)}
              className="
                flex
                min-h-[6.25rem]
                w-full
                items-center
                gap-4
                rounded-[22px]
                bg-white
                px-4
                py-4
                text-left
                ring-1
                ring-[#F3F4F6]
                shadow-[0_8px_28px_rgba(17,24,39,0.06)]
                transition
                active:scale-[0.985]
              "
            >
              <span className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-visible rounded-[22px] bg-[#F8F5F5] sm:h-[6rem] sm:w-[6rem]">
                <ImageReveal
                  src={category.image}
                  alt={category.label}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  fetchPriority={index < 2 ? 'high' : 'low'}
                  draggable={false}
                  className="h-[4.5rem] w-[4.5rem] origin-center scale-[1.32] select-none object-contain sm:h-[5rem] sm:w-[5rem] sm:scale-[1.26]"
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
                  {category.label}
                </span>

                <span className="mt-0.5 text-[13px] font-medium text-neutral-400">
                  Найти мастеров
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};