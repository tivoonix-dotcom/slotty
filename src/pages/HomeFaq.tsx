import type { FC } from 'react';
import { HOME_FAQ_ITEMS } from './home/homeFaqContent';
import { LandingFaqSection } from './home/LandingFaqSection';

export const HomeFaq: FC = () => (
  <LandingFaqSection
    items={HOME_FAQ_ITEMS}
    heading="Частые вопросы"
    headingId="home-faq-heading"
  />
);
