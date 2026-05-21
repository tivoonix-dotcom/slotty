import type { FC } from 'react';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homeSection } from './homeTheme';

const PHOTO = (name: string) => `/photos/ШАГИ/${name}`;

const BENTO_PHOTOS = [
  { src: PHOTO('4.png'), alt: '', containOnMobile: true },
  { src: PHOTO('2.png'), alt: 'Выберите время', containOnMobile: false },
] as const;

type Step = {
  label: string;
  title: string;
  text: string;
};

const STEPS_LEFT: Step[] = [
  {
    label: 'Шаг 1',
    title: 'Выберите услугу',
    text: 'Откройте нужную категорию и найдите подходящего мастера.',
  },
  {
    label: 'Шаг 2',
    title: 'Выберите время',
    text: 'Смотрите свободные окна и записывайтесь без звонков.',
  },
];

const STEPS_RIGHT: Step[] = [
  {
    label: 'Шаг 3',
    title: 'Запишитесь',
    text: 'Подтвердите визит в пару кликов — без звонков и переписок.',
  },
  {
    label: 'Шаг 4',
    title: 'Получите напоминание',
    text: 'Подтверждение и напоминание придут прямо в Telegram.',
  },
];

const BENTO_ROUND = 'overflow-hidden rounded-[20px] sm:rounded-[28px]';
const BENTO_SURFACE = 'bg-[#FAF7F4]';

function StepBadge({ children }: { children: string }) {
  return (
    <span className="mb-3 inline-flex w-fit rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-[12px] sm:tracking-[0.14em]">
      {children}
    </span>
  );
}

function StepItem({ step }: { step: Step }) {
  return (
    <li>
      <StepBadge>{step.label}</StepBadge>
      <h3 className="text-[1.375rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#111827] sm:text-[clamp(1.5rem,4.5vw,2.25rem)] sm:leading-[1.08] sm:tracking-[-0.03em]">
        {step.title}
      </h3>
      <p className="mt-2 text-[15px] leading-[1.5] text-[#4B5563] sm:mt-3 sm:max-w-[28rem] sm:text-[18px] sm:leading-[1.5]">
        {step.text}
      </p>
    </li>
  );
}

function BentoImageOnly({
  src,
  alt,
  priority,
  containOnMobile = false,
  className = '',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  containOnMobile?: boolean;
  className?: string;
}) {
  const fitClass = containOnMobile
    ? 'object-contain object-center p-3 sm:object-cover sm:p-0'
    : 'object-cover';

  return (
    <article
      className={`${BENTO_ROUND} ${containOnMobile ? 'bg-[#FAF7F4]' : ''} aspect-[4/5] w-full sm:aspect-auto sm:min-h-0 ${className}`}
    >
      <ImageReveal
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        draggable={false}
        className={`block h-full w-full ${fitClass}`}
      />
    </article>
  );
}

function BentoStepsCard({ steps, className = '' }: { steps: Step[]; className?: string }) {
  return (
    <article
      className={`${BENTO_ROUND} ${BENTO_SURFACE} flex flex-col justify-center p-5 sm:min-h-0 sm:p-10 ${className}`}
    >
      <ol className="space-y-6 sm:space-y-12">
        {steps.map((step) => (
          <StepItem key={step.label} step={step} />
        ))}
      </ol>
    </article>
  );
}

export const HomeHowItWorks: FC = () => {
  return (
    <section className={homeSection} aria-labelledby="home-how-heading">
      <div className="mx-auto max-w-[68rem]">
        <div className="mx-auto max-w-[40rem] px-1 text-center sm:px-0">
          <h2
            id="home-how-heading"
            className="text-[clamp(1.75rem,5.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
          >
            Как работает запись
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2.5 sm:mt-14 sm:grid-cols-12 sm:items-stretch sm:gap-4">
          <BentoStepsCard steps={STEPS_LEFT} className="sm:col-span-7 sm:min-h-[18rem] sm:h-full" />

          <div className="grid grid-cols-2 gap-2.5 sm:contents">
            <div className="sm:col-span-5 sm:flex sm:h-full">
              <BentoImageOnly
                src={BENTO_PHOTOS[0].src}
                alt={BENTO_PHOTOS[0].alt}
                priority
                containOnMobile={BENTO_PHOTOS[0].containOnMobile}
                className="sm:aspect-[4/5]"
              />
            </div>

            <div className="sm:col-span-5 sm:flex sm:h-full">
              <BentoImageOnly
                src={BENTO_PHOTOS[1].src}
                alt={BENTO_PHOTOS[1].alt}
                containOnMobile={BENTO_PHOTOS[1].containOnMobile}
                className="sm:aspect-[4/5]"
              />
            </div>
          </div>

          <BentoStepsCard steps={STEPS_RIGHT} className="sm:col-span-7 sm:h-full" />
        </div>
      </div>
    </section>
  );
};
