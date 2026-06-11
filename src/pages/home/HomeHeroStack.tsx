import type { FC } from 'react';
import { HomeHero, type HomeHeroProps } from './HomeHero';

export const HomeHeroStack: FC<HomeHeroProps> = (props) => {
  return (
    <div className="w-full">
      <HomeHero {...props} />
    </div>
  );
};
