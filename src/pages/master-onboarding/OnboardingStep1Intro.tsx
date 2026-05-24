import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useSwipeHorizontal } from '../client/hooks/useSwipeHorizontal';

const AUTO_MS = 2400;

type Slide = {
  imageSrc: string;
  title: string;
  text: string;
  icon: ReactNode;
};

const SLIDES: Slide[] = [
  {
    imageSrc: '/photos/step1/profile.webp',
    title: 'Профиль',
    text: 'Имя, описание и контакты',
    icon: <IconProfile />,
  },
  {
    imageSrc: '/photos/step1/adress.webp',
    title: 'Адрес',
    text: 'Место приёма клиентов',
    icon: <IconMap />,
  },
  {
    imageSrc: '/photos/step1/services.webp',
    title: 'Услуги',
    text: 'Цены, длительность и описание',
    icon: <IconServices />,
  },
  {
    imageSrc: '/photos/step1/sertificate.webp',
    title: 'Доверие',
    text: 'Сертификаты и подтверждения',
    icon: <IconTrust />,
  },
];

function IconProfile() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  );
}

function IconServices() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function IconTrust() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3 4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  onStart?: () => void;
};

export function OnboardingStep1Intro({ onStart }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const id = window.setInterval(next, AUTO_MS);
    return () => window.clearInterval(id);
  }, [next, paused]);

  const onDotClick = (i: number) => {
    goTo(i);
    setPaused(true);
    window.setTimeout(() => setPaused(false), AUTO_MS * 2);
  };

  const swipePrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const swipeNext = useCallback(() => next(), [next]);
  const swipe = useSwipeHorizontal(swipePrev, swipeNext);

  const startButtonClass =
    'flex min-h-[3.15rem] w-full cursor-pointer items-center justify-center rounded-full bg-[#E29595] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition hover:opacity-90 active:scale-[0.98] sm:min-h-[3.25rem] sm:text-[16px]';

  return (
    <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-center lg:gap-10 xl:gap-14">
      <div className="mx-auto w-full min-w-0 max-w-sm lg:mx-0 lg:max-w-none">
        <p className="mb-2 text-center text-[12px] font-semibold tabular-nums text-neutral-400 lg:hidden">
          {index + 1} / {SLIDES.length}
        </p>

        <div
          className="relative overflow-hidden rounded-[32px] bg-[#F8F0F0] shadow-[inset_0_0_0_1px_rgba(226,149,149,0.12)] sm:rounded-[36px] lg:rounded-[20px]"
          aria-roledescription="carousel"
          aria-label="Что входит в анкету мастера"
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {SLIDES.map((s) => (
                <div key={s.imageSrc} className="w-full shrink-0 px-3 pb-2 pt-3 sm:px-4 sm:pt-4 lg:px-5 lg:pb-3 lg:pt-4">
                  <div className="relative aspect-[4/4.2] w-full overflow-hidden rounded-[26px] bg-[#FDF6F6] sm:rounded-[28px] lg:aspect-[4/3.6] lg:rounded-[16px]">
                    <img
                      src={s.imageSrc}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain object-center"
                    />
                  </div>

                  <div className="px-1 pb-1 pt-5 text-center sm:px-2 sm:pt-6 lg:hidden">
                    <h2 className="break-words text-[22px] font-semibold leading-tight tracking-[-0.05em] text-neutral-950 sm:text-[28px] sm:tracking-[-0.06em]">
                      {s.title}
                    </h2>
                    <p className="mt-2 text-[15px] leading-snug text-neutral-500 sm:text-[16px]">{s.text}</p>

                    <div
                      className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E29595] text-white shadow-[0_10px_26px_rgba(226,149,149,0.32)]"
                      aria-hidden
                    >
                      {s.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 lg:hidden" role="tablist" aria-label="Слайды">
          {SLIDES.map((s, i) => (
            <button
              key={s.imageSrc}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.title}: ${s.text}`}
              onClick={() => onDotClick(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-[#E29595]' : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>

        {onStart ? (
          <button type="button" onClick={onStart} className={`relative z-20 mt-6 lg:hidden ${startButtonClass}`}>
            Начать заполнение
          </button>
        ) : null}
      </div>

      <div className="hidden min-w-0 lg:flex lg:flex-col lg:justify-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#E29595]">Шаг 1 из 8</p>
        <h1 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 xl:text-[36px]">
          Что входит в анкету мастера
        </h1>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-neutral-500">
          Заполнение займёт около 10 минут. Можно сохранить черновик и вернуться позже.
        </p>

        <ul className="mt-8 space-y-2.5" aria-label="Разделы анкеты">
          {SLIDES.map((s, i) => {
            const active = i === index;
            return (
              <li key={s.imageSrc}>
                <button
                  type="button"
                  onClick={() => onDotClick(i)}
                  aria-current={active ? 'step' : undefined}
                  className={`flex w-full items-center gap-4 rounded-[14px] px-4 py-3.5 text-left transition ${
                    active ? 'bg-[#FFF5F5] ring-1 ring-[#E29595]/25' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                      active ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.28)]' : 'bg-[#F1EFEF] text-neutral-600'
                    }`}
                  >
                    {s.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-neutral-950">{s.title}</span>
                    <span className="block text-[13px] leading-snug text-neutral-500">{s.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {onStart ? (
          <button type="button" onClick={onStart} className={`mt-8 max-w-sm ${startButtonClass}`}>
            Начать заполнение
          </button>
        ) : null}
      </div>
    </div>
  );
}
