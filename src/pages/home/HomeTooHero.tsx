import { useEffect, useState, type FC } from 'react';

const heroPhoto = (file: string) =>
  `/photos/${encodeURIComponent('херо')}/${encodeURIComponent(file)}`;

const HERO_SLIDES = ['1.png', '2.png', '3.png', '4.png'].map(heroPhoto) as readonly string[];

const SLIDE_INTERVAL_MS = 5200;
const FADE_MS = 1600;

const HERO_ASPECT_CLASS = 'aspect-[1672/941]';

const plateClass =
  'mt-10 rounded-[24px] bg-[#F1EFEF] p-3 sm:mt-14 sm:rounded-[32px] sm:p-4';

const slideFrameClass =
  `relative w-full overflow-hidden rounded-[18px] ${HERO_ASPECT_CLASS} sm:rounded-[26px]`;

export const HomeTooHero: FC = () => {
  const [active, setActive] = useState(0);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setMotionOk(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!motionOk) return;

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [motionOk]);

  useEffect(() => {
    HERO_SLIDES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className={plateClass} aria-hidden>
      <div className={slideFrameClass}>
        {HERO_SLIDES.map((src, i) => {
          const isActive = i === active;

          return (
            <img
              key={src}
              src={src}
              alt=""
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              draggable={false}
              className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity ease-in-out motion-reduce:transition-none ${
                isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
              }`}
              style={{ transitionDuration: motionOk ? `${FADE_MS}ms` : '0ms' }}
            />
          );
        })}
      </div>
    </div>
  );
};
