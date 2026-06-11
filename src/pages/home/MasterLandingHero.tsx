import type { FC } from 'react';
import { LANDING_ANCHOR_MASTER_HOME } from '../../shared/layout/SlottyHeader/headerNav';
import { CATALOG_HERO_FULL_BLEED_CLASS } from '../../shared/layout/clientShellLayout';
import { SlottyImg } from '../../shared/ui/SlottyImg';
import {
  HOME_HERO_BEPAID_SRC,
  HOME_HERO_CATALOG_BTN_BG_SRC,
  HOME_HERO_LINE_SRC,
  HOME_HERO_TIVONIX_SRC,
} from './homeHeroAssets';
import { homeShell } from './homeLayout';
import { LandingReveal } from './LandingReveal';
import { MasterLandingCabinetDemoFrame } from './MasterLandingCabinetDemoFrame';
import { MasterLandingServiceDemo } from './MasterLandingServiceDemo';
import {
  homeHeroBecomeMasterBtn,
  homeHeroCatalogBtn,
  homeHeroCtaRow,
  homeHeroStatItem,
  homeHeroStatText,
  homeHeroStatsList,
  homeHeroStatValue,
  homeHeroSubtitle,
  homeHeroTitle,
  homeLandingFeatureVisualBleed,
} from './homeTheme';

const HERO_STATS = [
  { value: '24/7', text: 'онлайн-запись без переписок в Direct.' },
  { value: '1\u00A0клик', text: 'подтверждение заявки в кабинете.' },
  { value: '0\u00A0BYN', text: 'старт на бесплатном тарифе мастера.' },
] as const;

export type MasterLandingHeroProps = {
  onBecomeMaster: () => void;
  onCatalog: () => void;
};

export const MasterLandingHero: FC<MasterLandingHeroProps> = ({ onBecomeMaster, onCatalog }) => {
  return (
    <section
      id={LANDING_ANCHOR_MASTER_HOME}
      className="relative w-full scroll-mt-28 overflow-x-clip bg-white pb-8 sm:pb-10"
      aria-labelledby="master-landing-hero-heading"
    >
      <div
        className={`${homeShell} relative z-10 flex flex-col items-center pb-4 text-center sm:pb-5`}
        style={{
          paddingTop:
            'calc(var(--slotty-header-height, 5.5rem) + clamp(1.25rem, 4vw, 2.5rem))',
        }}
      >
        <LandingReveal
          as="h1"
          id="master-landing-hero-heading"
          className={homeHeroTitle}
          immediate
          variant="blur-up"
        >
          Твой кабинет мастера — всё под контролем.
        </LandingReveal>

        <LandingReveal as="p" className={homeHeroSubtitle} immediate variant="up" delay={90}>
          Записи, услуги и расписание в одном месте — клиенты находят вас сами.
        </LandingReveal>

        <LandingReveal immediate variant="scale" delay={180}>
          <div className={homeHeroCtaRow}>
            <button type="button" onClick={() => onBecomeMaster()} className={homeHeroBecomeMasterBtn}>
              стать мастером
            </button>
            <button
              type="button"
              onClick={() => onCatalog()}
              className={homeHeroCatalogBtn}
              style={{ backgroundImage: `url('${HOME_HERO_CATALOG_BTN_BG_SRC}')` }}
            >
              каталог
            </button>
          </div>
        </LandingReveal>
      </div>

      <div className={`${homeShell} relative z-10 mt-6 sm:mt-8`}>
        <div className={homeLandingFeatureVisualBleed}>
          <LandingReveal variant="scale" delay={260} duration={1100}>
            <MasterLandingCabinetDemoFrame
              variant="hero-phone"
              ariaLabel="Демо: кабинет мастера — создание услуги"
            >
              <MasterLandingServiceDemo />
            </MasterLandingCabinetDemoFrame>
          </LandingReveal>
        </div>
      </div>

      <div className={`${CATALOG_HERO_FULL_BLEED_CLASS} relative z-0 -mt-4 sm:-mt-6`}>
        <SlottyImg
          src={HOME_HERO_LINE_SRC}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          className="block w-full object-contain object-center"
        />
      </div>

      <LandingReveal
        className={`${homeShell} relative z-10 -mt-7 flex items-center justify-center gap-12 sm:-mt-10 sm:gap-16`}
        immediate
        variant="up"
        delay={380}
      >
        <SlottyImg
          src={HOME_HERO_BEPAID_SRC}
          alt="BePaid"
          decoding="async"
          loading="lazy"
          className="h-6 w-auto object-contain sm:h-7"
        />
        <SlottyImg
          src={HOME_HERO_TIVONIX_SRC}
          alt="Tivonix"
          decoding="async"
          loading="lazy"
          className="h-8 w-auto object-contain sm:h-10"
        />
      </LandingReveal>

      <div className={`${homeShell} mt-8 sm:mt-10`}>
        <ul className={homeHeroStatsList}>
          {HERO_STATS.map((item, index) => (
            <LandingReveal
              as="li"
              key={item.value}
              className={homeHeroStatItem}
              immediate
              variant="up"
              delay={460 + index * 90}
            >
              <span className={homeHeroStatValue}>{item.value}</span>
              <p className={homeHeroStatText}>{item.text}</p>
            </LandingReveal>
          ))}
        </ul>
      </div>
    </section>
  );
};
