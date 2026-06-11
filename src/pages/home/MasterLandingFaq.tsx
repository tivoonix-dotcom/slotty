import type { FC } from 'react';
import { LandingFaqSection } from './LandingFaqSection';
import { MASTER_LANDING_FAQ_ITEMS } from './masterLandingFaqContent';

export const MasterLandingFaq: FC = () => (
  <LandingFaqSection
    items={MASTER_LANDING_FAQ_ITEMS}
    heading="Вопросы мастеров"
    headingId="master-faq-heading"
  />
);
