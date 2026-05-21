import type { FC } from 'react';
import { HomeHero, type HomeHeroProps } from './HomeHero';
import { HomeTooHero } from './HomeTooHero';
import { homeShell } from './homeLayout';

export const HomeHeroStack: FC<HomeHeroProps> = (props) => {
  return (
    <div className={`${homeShell} pt-[calc(5.25rem+env(safe-area-inset-top,0px))]`}>
      <div className="relative overflow-hidden pb-0 sm:overflow-visible sm:pb-4">
        <HomeHero {...props} />
        <HomeTooHero />
      </div>
    </div>
  );
};
