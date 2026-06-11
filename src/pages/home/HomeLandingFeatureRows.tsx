import type { FC } from 'react';
import { SlottyImg } from '../../shared/ui/SlottyImg';
import { HomeLandingDateStrip } from './HomeLandingDateStrip';
import { HomeLandingNearbyMarquee } from './HomeLandingNearbyMarquee';
import { HomeLandingNotifyDemo } from './HomeLandingNotifyDemo';
import {
  HOME_LANDING_FEATURE_BLUE_SRC,
  HOME_LANDING_FEATURE_GREEN_SRC,
  HOME_LANDING_FEATURE_RED_SRC,
} from './homeLandingFeatureAssets';
import { homeShell } from './homeLayout';
import { LandingReveal } from './LandingReveal';
import { LANDING_ANCHOR_HOW } from '../../shared/layout/SlottyHeader/headerNav';
import {
  homeLandingFeatureImage,
  homeLandingFeatureImageWrap,
  homeLandingFeatureLead,
  homeLandingFeatureList,
  homeLandingFeatureListItem,
  homeLandingFeatureListMobile,
  homeLandingFeatureRow,
  homeLandingFeatureRowsSection,
  homeLandingFeatureTextCol,
  homeLandingFeatureTitle,
  homeLandingFeatureVisualBleed,
  homeLandingFeatureVisualCol,
} from './homeTheme';

type FeatureRow = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  imageFirst: boolean;
  title: string;
  lead: string;
  bullets: readonly string[];
};

const FEATURE_ROWS: FeatureRow[] = [
  {
    id: 'direct',
    imageSrc: HOME_LANDING_FEATURE_GREEN_SRC,
    imageAlt: 'Запись к мастеру без Direct и звонков',
    imageFirst: false,
    title: 'Забудь про Direct и звонки.',
    lead: 'Больше не нужно ждать ответа часами. Все мастера и свободные места уже в твоем телефоне.',
    bullets: [
      'Забудь про Direct, звонки и ожидание ответов.',
      'Открой карту: все мастера, прайсы уже на экране.',
      'Выбирай топ-профи рядом в один клик.',
    ],
  },
  {
    id: 'schedule',
    imageSrc: HOME_LANDING_FEATURE_BLUE_SRC,
    imageAlt: 'Управление графиком записи 24/7',
    imageFirst: true,
    title: 'Управляй графиком 24/7.',
    lead: 'Записывайся на процедуры в любое время — хоть в обеденный перерыв, хоть глубокой ночью.',
    bullets: [
      'Без долгих согласований и переписок.',
      'Свободные окошки видны в реальном времени.',
      'Записывайся в один тап — в любой момент.',
    ],
  },
  {
    id: 'relax',
    imageSrc: HOME_LANDING_FEATURE_RED_SRC,
    imageAlt: 'Напоминания и контроль бьюти-календаря',
    imageFirst: false,
    title: 'Отдыхай и наслаждайся.',
    lead: 'Получай автоматические напоминания о визитах. Весь твой бьюти-календарь теперь под полным контролем.',
    bullets: [
      'Мгновенное подтверждение записи без блокнотов.',
      'Приложение само напомнит о визите.',
      'Весь бьюти-календарь под полным контролем.',
    ],
  },
];

function FeatureBullets({
  bullets,
  listClassName,
  baseDelay = 200,
}: {
  bullets: readonly string[];
  listClassName: string;
  baseDelay?: number;
}) {
  return (
    <ul className={listClassName}>
      {bullets.map((bullet, bulletIndex) => (
        <LandingReveal
          as="li"
          key={bullet}
          className={homeLandingFeatureListItem}
          variant="up"
          delay={baseDelay + bulletIndex * 70}
          threshold={0.08}
        >
          {bullet}
        </LandingReveal>
      ))}
    </ul>
  );
}

export const HomeLandingFeatureRows: FC = () => {
  return (
    <section
      id={LANDING_ANCHOR_HOW}
      className={`${homeLandingFeatureRowsSection} scroll-mt-28`}
      aria-label="Преимущества Slotty"
    >
      <div className={homeShell}>
        <div className="flex flex-col gap-16 sm:gap-20 lg:gap-24">
          {FEATURE_ROWS.map((row, index) => (
            <article key={row.id} className={homeLandingFeatureRow} aria-labelledby={`landing-feature-${row.id}-title`}>
              <LandingReveal
                className={`${homeLandingFeatureTextCol} order-1 ${row.imageFirst ? 'lg:order-2' : 'lg:order-1'}`}
                variant={row.imageFirst ? 'right' : 'left'}
                delay={120}
              >
                <h2 id={`landing-feature-${row.id}-title`} className={homeLandingFeatureTitle}>
                  {row.title}
                </h2>
                <p className={homeLandingFeatureLead}>{row.lead}</p>
                <FeatureBullets bullets={row.bullets} listClassName={homeLandingFeatureList} />
              </LandingReveal>

              <LandingReveal
                className={`${homeLandingFeatureVisualCol} ${homeLandingFeatureVisualBleed} order-2 ${row.imageFirst ? 'lg:order-1' : 'lg:order-2'}`}
                variant={row.imageFirst ? 'left' : 'right'}
                delay={40}
                duration={1050}
              >
                <div className={homeLandingFeatureImageWrap}>
                  <SlottyImg
                    src={row.imageSrc}
                    alt={row.imageAlt}
                    decoding="async"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                    draggable={false}
                    className={homeLandingFeatureImage}
                  />
                  {row.id === 'direct' ? <HomeLandingNearbyMarquee /> : null}
                  {row.id === 'schedule' ? <HomeLandingDateStrip /> : null}
                  {row.id === 'relax' ? <HomeLandingNotifyDemo /> : null}
                </div>
              </LandingReveal>

              <FeatureBullets
                bullets={row.bullets}
                listClassName={homeLandingFeatureListMobile}
                baseDelay={280}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
