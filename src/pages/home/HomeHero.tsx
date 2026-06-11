import type { FC } from 'react';
import { CATALOG_HERO_FULL_BLEED_CLASS } from '../../shared/layout/clientShellLayout';
import { SlottyImg } from '../../shared/ui/SlottyImg';
import {
  HOME_HERO_BEPAID_SRC,
  HOME_HERO_CATALOG_BTN_BG_SRC,
  HOME_HERO_LINE_SRC,
  HOME_HERO_MASTER_BANNER_SRC,
  HOME_HERO_TIVONIX_SRC,
} from './homeHeroAssets';
import { homeShell } from './homeLayout';
import { LandingReveal } from './LandingReveal';
import {
  homeHeroBecomeMasterBtn,
  homeHeroCatalogBtn,
  homeHeroCtaRow,
  homeHeroMasterBannerBtn,
  homeHeroMasterBannerContent,
  homeHeroMasterBannerImageWrap,
  homeHeroMasterBannerLabel,
  homeHeroMasterBannerShell,
  homeHeroMasterBannerTitle,
  homeHeroStatItem,
  homeHeroStatText,
  homeHeroStatsList,
  homeHeroStatValue,
  homeHeroSubtitle,
  homeHeroTitle,
} from './homeTheme';

const HERO_STATS = [
  { value: '80%', text: 'экономии времени на переписках.' },
  { value: '90%', text: 'мастеров прямо около твоего дома.' },
  { value: '0%', text: 'звонков и лишних вопросов..' },
] as const;

export type HomeHeroProps = {
  onFindMaster: () => void;
  onBecomeMaster: () => void;
};

export const HomeHero: FC<HomeHeroProps> = ({ onFindMaster, onBecomeMaster }) => {
  return (
    <section
      className="relative w-full scroll-mt-28 overflow-x-clip bg-white pb-8 sm:pb-10"
      aria-labelledby="home-hero-heading"
    >
      <div
        className={`${homeShell} relative z-10 flex flex-col items-center pb-4 text-center sm:pb-5`}
        style={{
          paddingTop:
            'calc(var(--slotty-header-height, 5.5rem) + clamp(1.25rem, 4vw, 2.5rem))',
        }}
      >
        <LandingReveal as="h1" id="home-hero-heading" className={homeHeroTitle} immediate variant="blur-up">
          Твой личный доступ к лучшим мастерам.
        </LandingReveal>

        <LandingReveal as="p" className={homeHeroSubtitle} immediate variant="up" delay={90}>
          Твой бьюти-график теперь под полным контролем.
        </LandingReveal>

        <LandingReveal immediate variant="scale" delay={180}>
          <div className={homeHeroCtaRow}>
            <button
              type="button"
              onClick={() => onFindMaster()}
              className={homeHeroCatalogBtn}
              style={{ backgroundImage: `url('${HOME_HERO_CATALOG_BTN_BG_SRC}')` }}
            >
              каталог
            </button>
            <button type="button" onClick={() => onBecomeMaster()} className={homeHeroBecomeMasterBtn}>
              стать мастером
            </button>
          </div>
        </LandingReveal>
      </div>

      <div className={`${CATALOG_HERO_FULL_BLEED_CLASS} relative z-0 -mt-6 sm:-mt-8`}>
        <SlottyImg
          src={HOME_HERO_LINE_SRC}
          alt=""
          decoding="async"
          loading="eager"
          fetchPriority="high"
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

      <div className={homeShell}>
        <LandingReveal variant="scale" delay={80}>
          <div className={homeHeroMasterBannerShell}>
            <div className={homeHeroMasterBannerImageWrap}>
              <SlottyImg
                src={HOME_HERO_MASTER_BANNER_SRC}
                alt=""
                decoding="async"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className={homeHeroMasterBannerContent}>
                <p className={homeHeroMasterBannerLabel}>Мастер</p>
                <h2 className={homeHeroMasterBannerTitle}>
                  Лучшие мастера твоего города — в твоем телефоне.
                </h2>
                <button type="button" onClick={() => onFindMaster()} className={homeHeroMasterBannerBtn}>
                  каталог
                </button>
              </div>
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
};
