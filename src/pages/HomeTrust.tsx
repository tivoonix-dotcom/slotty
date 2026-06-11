import type { FC } from 'react';
import { SlottyImg } from '../shared/ui/SlottyImg';
import { HOME_LANDING_TRUST_GRAPHIC_SRC } from './home/homeLandingTrustAssets';
import { LandingReveal } from './home/LandingReveal';
import {
  homeLandingTrustGraphic,
  homeLandingTrustOverlay,
  homeLandingTrustShell,
  homeLandingTrustStat,
  homeLandingTrustStatAccent,
  homeLandingTrustStats,
  homeSection,
} from './home/homeTheme';

const STATS = [
  { text: '6 категорий', accent: false },
  { text: 'Онлайн-запись 24/7', accent: false },
  { text: 'Telegram-напоминания', accent: true },
] as const;

export const HomeTrust: FC = () => {
  return (
    <section
      id="nagrady"
      className={homeSection}
      aria-labelledby="home-trust-heading"
    >
      <LandingReveal className={homeLandingTrustShell} variant="scale" duration={1100}>
        <SlottyImg
          src={HOME_LANDING_TRUST_GRAPHIC_SRC}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className={homeLandingTrustGraphic}
          aria-hidden
        />

        <div className={homeLandingTrustOverlay}>
          <h2 id="home-trust-heading" className="sr-only">
            Преимущества SLOTTY
          </h2>

          <ul className={homeLandingTrustStats}>
            {STATS.map((item, index) => (
              <LandingReveal
                as="li"
                key={item.text}
                className={item.accent ? homeLandingTrustStatAccent : homeLandingTrustStat}
                variant="blur-up"
                delay={180 + index * 80}
              >
                {item.text}
              </LandingReveal>
            ))}
          </ul>
        </div>
      </LandingReveal>
    </section>
  );
};
