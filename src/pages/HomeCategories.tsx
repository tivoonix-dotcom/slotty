import type { FC } from 'react';

const CATEGORIES = [
  {
    key: 'manicure',
    label: 'Маникюр',
    image: '/photos/work/manicure.png',
  },
  {
    key: 'barbers',
    label: 'Барберы',
    image: '/photos/work/barbers.png',
  },
  {
    key: 'brows_lashes',
    label: 'Брови и ресницы',
    image: '/photos/work/brows_lashes.png',
  },
  {
    key: 'massage',
    label: 'Массаж',
    image: '/photos/work/massage.png',
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    image: '/photos/work/fitness.png',
  },
  {
    key: 'tattoo',
    label: 'Тату',
    image: '/photos/work/tattoo.png',
  },
];

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section className="mt-14 animate-fade-enter scroll-mt-28" style={{ animationDelay: '120ms' }}>
      <div className="mb-6 px-1 text-center">


        <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-neutral-950">
          Что ищем?
        </h2>
      </div>

      <div className="rounded-[36px] bg-[#F1EFEF] px-4 py-5 shadow-[0_24px_70px_rgba(17,17,17,0.05)]">
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((category) => (
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
                rounded-[24px]
                bg-white
                px-4
                py-4
                text-left
                shadow-[0_12px_35px_rgba(17,17,17,0.04)]
                transition
                active:scale-[0.985]
              "
            >
              <span className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-visible rounded-[22px] bg-[#F8F5F5] sm:h-[6rem] sm:w-[6rem]">
                <img
                  src={category.image}
                  alt={category.label}
                  loading="lazy"
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