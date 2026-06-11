import type { FC } from 'react';
import { LandingReveal } from './LandingReveal';
import {
  homeLandingFaqAnswer,
  homeLandingFaqAnswerClip,
  homeLandingFaqAnswerLead,
  homeLandingFaqAnswerShell,
  homeLandingFaqAnswerWrap,
  homeLandingFaqHeading,
  homeLandingFaqItem,
  homeLandingFaqList,
  homeLandingFaqQuestion,
  homeLandingFaqToggle,
  homeSection,
} from './homeTheme';

export type LandingFaqItem = {
  readonly key: string;
  readonly q: string;
  readonly lead: string;
  readonly a: string;
};

type LandingFaqSectionProps = {
  items: readonly LandingFaqItem[];
  heading?: string;
  headingId?: string;
  sectionId?: string;
};

export const LandingFaqSection: FC<LandingFaqSectionProps> = ({
  items,
  heading = 'Частые вопросы',
  headingId = 'landing-faq-heading',
  sectionId = 'faq',
}) => {
  return (
    <section id={sectionId} className={homeSection} aria-labelledby={headingId}>
      <LandingReveal as="h2" id={headingId} className={homeLandingFaqHeading} variant="blur-up">
        {heading}
      </LandingReveal>

      <div className={homeLandingFaqList}>
        {items.map((item, index) => (
          <LandingReveal key={item.key} variant="up" delay={70 + index * 55} threshold={0.08}>
            <details className={homeLandingFaqItem}>
              <summary className={homeLandingFaqQuestion}>
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className={homeLandingFaqToggle} aria-hidden>
                    +
                  </span>
                </span>
              </summary>

              <div className={homeLandingFaqAnswerShell}>
                <div className={homeLandingFaqAnswerClip}>
                  <div className={homeLandingFaqAnswerWrap}>
                    <span className={homeLandingFaqAnswerLead}>{item.lead}</span>
                    <span className={homeLandingFaqAnswer}>{item.a}</span>
                  </div>
                </div>
              </div>
            </details>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
};
