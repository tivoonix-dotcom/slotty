import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { homeSection } from './home/homeTheme';

const TRUST_IMAGE_DESKTOP = '/photos/Онлайн-запись.png';
const TRUST_IMAGE_MOBILE = '/photos/онлайнзаписьмбилка.png';

const STATS = ['6 категорий', 'Онлайн-запись 24/7', 'Telegram-напоминания'] as const;

const imgClass = 'block h-auto w-full object-contain';

function TrustOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-8 text-center sm:px-10 sm:py-12">
      <h2 id="home-trust-heading" className="sr-only">
        Преимущества SLOTTY
      </h2>

      <ul className="flex w-full max-w-[20rem] flex-col items-center gap-2.5 text-center sm:max-w-lg sm:gap-4">
        {STATS.map((title, index) => (
          <li
            key={title}
            className={
              index === 2
                ? 'bg-gradient-to-r from-[#F47C8C] to-[#F26D83] bg-clip-text text-[1.1rem] font-bold leading-[1.1] tracking-tight text-transparent sm:text-[clamp(1.25rem,5vw,2rem)]'
                : 'text-[1.1rem] font-bold leading-[1.1] tracking-tight text-[#111827] sm:text-[clamp(1.25rem,5vw,2rem)]'
            }
          >
            {title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const HomeTrust: FC = () => {
  return (
    <section id="nagrady" className={homeSection} style={{ animationDelay: '80ms' }} aria-labelledby="home-trust-heading">
      <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[28px]">
        <div className="relative sm:hidden">
          <ImageReveal
            src={TRUST_IMAGE_MOBILE}
            alt=""
            loading="lazy"
            draggable={false}
            className={imgClass}
            aria-hidden
          />
          <TrustOverlay />
        </div>

        <div className="relative hidden sm:block">
          <ImageReveal
            src={TRUST_IMAGE_DESKTOP}
            alt=""
            loading="lazy"
            draggable={false}
            className={imgClass}
            aria-hidden
          />
          <TrustOverlay />
        </div>
      </div>
    </section>
  );
};
