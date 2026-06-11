import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { HOME_LANDING_CATEGORIES } from './home/homeLandingCategoryAssets';
import { LandingReveal } from './home/LandingReveal';
import {
  homeLandingCategoryCard,
  homeLandingCategoryCta,
  homeLandingCategoryImage,
  homeLandingCategoryImageWrap,
  homeLandingCategoryLabel,
  homeLandingCategoryOverlay,
  homeLandingCategoryTitle,
  homeLandingHeading,
  homeSection,
} from './home/homeTheme';

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section
      className={`${homeSection} !mt-12 sm:!mt-16`}
      aria-labelledby="home-categories-heading"
    >
      <LandingReveal as="h2" id="home-categories-heading" className={`text-left ${homeLandingHeading}`} variant="blur-up">
        Выберите услугу
      </LandingReveal>

      <div className="mt-10 mr-[calc(50%-50vw)] overflow-x-auto [scrollbar-width:none] sm:mt-14 [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max list-none snap-x snap-mandatory gap-4 pb-2 sm:gap-5">
          {HOME_LANDING_CATEGORIES.map((category, index) => (
            <LandingReveal
              as="li"
              key={category.key}
              className={homeLandingCategoryCard}
              variant="scale"
              delay={80 + index * 65}
              threshold={0.06}
            >
              <button
                type="button"
                onClick={() => onCategory(category.key)}
                aria-label={`${category.label}. ${category.headline}`}
                className="group block w-full text-left transition active:opacity-95"
              >
                <div className={homeLandingCategoryImageWrap}>
                  <ImageReveal
                    src={category.image}
                    alt=""
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index < 2 ? 'high' : 'low'}
                    draggable={false}
                    className={homeLandingCategoryImage}
                  />
                  <div className={homeLandingCategoryOverlay}>
                    <p className={homeLandingCategoryLabel}>{category.label}</p>
                    <p className={homeLandingCategoryTitle}>{category.headline}</p>
                    <span className={homeLandingCategoryCta} aria-hidden>
                      каталог
                    </span>
                  </div>
                </div>
              </button>
            </LandingReveal>
          ))}
        </ul>
      </div>
    </section>
  );
};
