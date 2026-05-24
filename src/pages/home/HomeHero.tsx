import type { FC } from 'react';
import { HERO_BG_SRC } from '../../app/headerLogo';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homePinkBtn } from './homeTheme';

const heroPrimaryBtn = `w-full sm:w-auto sm:min-w-[11.5rem] ${homePinkBtn} min-h-12 px-8 text-[15px]`;

const heroSecondaryBtn =
  'inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D1D5DB] bg-white/95 px-8 text-[15px] font-semibold text-[#111827] shadow-sm backdrop-blur-sm transition hover:border-[#9CA3AF] hover:bg-white active:scale-[0.98] sm:w-auto sm:min-w-[11.5rem]';

export type HomeHeroProps = {
  onFindMaster: () => void;
  onBecomeMaster: () => void;
  masterCtaLabel: string;
};

export const HomeHero: FC<HomeHeroProps> = ({
  onFindMaster,
  onBecomeMaster,
  masterCtaLabel,
}) => {
  return (
    <section
      className="relative scroll-mt-28 rounded-[24px] sm:rounded-[28px]"
      aria-labelledby="home-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px] sm:rounded-[28px]"
        aria-hidden
      >
        <ImageReveal
          src={HERO_BG_SRC}
          alt=""
          loading="eager"
          fetchPriority="high"
          draggable={false}
          className="h-full w-full object-contain object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCFC]/88 via-[#FFFCFC]/72 to-[#FFFCFC]/88" />
      </div>

      <div className="relative z-10 flex min-h-[min(68vh,34rem)] flex-col items-center justify-center px-5 py-14 text-center sm:min-h-[min(72vh,38rem)] sm:px-8 sm:py-16">
        <h1
          id="home-hero-heading"
          className="mx-auto max-w-[18em] text-balance text-[clamp(2.25rem,7vw,4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#111827]"
        >
          Найдите мастера рядом и запишитесь онлайн
        </h1>

        <p className="mx-auto mt-3 max-w-[32em] text-pretty text-[clamp(1.0625rem,2.5vw,1.375rem)] font-normal leading-[1.5] text-[#555555] sm:mt-4">
          Выберите услугу, удобное время и мастера. SLOTTY помогает записаться без звонков,
          переписок и ожидания ответа.
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-[22rem] flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <button type="button" onClick={() => onFindMaster()} className={heroPrimaryBtn}>
            Найти мастера
          </button>
          <button type="button" onClick={() => onBecomeMaster()} className={heroSecondaryBtn}>
            {masterCtaLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
