import type { FC } from 'react';

const MOBILE_HERO_SRC = '/photos/MOBB.png';
const DESKTOP_HERO_SRC = '/photos/TOOHERO.png';

const imgClass =
  'block h-auto w-full max-w-full rounded-[22px] object-contain shadow-[0_18px_52px_rgba(244,124,140,0.2),0_8px_28px_rgba(17,24,39,0.08)] ring-1 ring-white/80 sm:rounded-[26px]';

export const HomeTooHero: FC = () => {
  return (
    <>
      <div className="relative z-20 -mt-12 w-full sm:hidden" aria-hidden>
        <img
          src={MOBILE_HERO_SRC}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          className={imgClass}
        />
      </div>

      <div
        className="
          relative z-20 -mt-12 hidden w-full
          sm:-mt-16 sm:block
          lg:-mt-20
        "
        aria-hidden
      >
        <img
          src={DESKTOP_HERO_SRC}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          className={imgClass}
        />
      </div>
    </>
  );
};
