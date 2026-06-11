import type { FC } from 'react';
import { MasterLandingAppointmentsDemo } from './MasterLandingAppointmentsDemo';
import { MasterLandingCabinetDemoFrame } from './MasterLandingCabinetDemoFrame';
import { LandingReveal } from './LandingReveal';
import {
  homeLandingFeatureVisualBleed,
  homeLandingMasterPromoBody,
  homeLandingMasterPromoCaption,
  homeLandingMasterPromoCta,
  homeLandingMasterPromoCtaWrap,
  homeLandingMasterPromoGrid,
  homeLandingMasterPromoHeading,
  homeLandingMasterPromoPhotoCol,
  homeLandingMasterPromoStep,
  homeLandingMasterPromoStepMobile,
  homeLandingMasterPromoStepNum,
  homeLandingMasterPromoSteps,
  homeLandingMasterPromoStepsCol,
  homeLandingMasterPromoStepsMobile,
  homeLandingMasterPromoStepText,
  homeSection,
} from './homeTheme';

const STEPS = [
  'Создайте профиль и покажите свой стиль',
  'Настройте календарь и услуги',
  'Получайте записи и растите как востребованный профи',
] as const;

function PromoSteps({
  listClassName,
  itemClassName,
  baseDelay = 80,
}: {
  listClassName: string;
  itemClassName: string;
  baseDelay?: number;
}) {
  return (
    <ol className={listClassName}>
      {STEPS.map((step, index) => (
        <LandingReveal
          as="li"
          key={step}
          className={itemClassName}
          variant="left"
          delay={baseDelay + index * 90}
        >
          <span className={homeLandingMasterPromoStepNum} aria-hidden>
            {index + 1}
          </span>
          <span className={homeLandingMasterPromoStepText}>{step}</span>
        </LandingReveal>
      ))}
    </ol>
  );
}

type HomeMasterBookingsPromoProps = {
  onMasterCabinet: () => void;
  ctaLabel?: string;
};

export const HomeMasterBookingsPromo: FC<HomeMasterBookingsPromoProps> = ({
  onMasterCabinet,
  ctaLabel = 'Кабинет мастера',
}) => {
  return (
    <section
      className={`${homeSection} scroll-mt-28`}
      aria-labelledby="home-master-promo-heading"
    >
      <LandingReveal as="header" className="min-w-0" variant="blur-up">
        <h2 id="home-master-promo-heading" className={homeLandingMasterPromoHeading}>
          Получайте больше записей с Slotty
        </h2>
        <p className={`${homeLandingMasterPromoBody} mt-4 sm:mt-5`}>
          Создайте свой кабинет мастера, добавьте услуги и откройте запись онлайн — клиенты
          смогут находить вас, видеть свободные окна и записываться.
        </p>
      </LandingReveal>

      <div className={homeLandingMasterPromoGrid}>
        <PromoSteps
          listClassName={`${homeLandingMasterPromoSteps} ${homeLandingMasterPromoStepsCol}`}
          itemClassName={homeLandingMasterPromoStep}
        />

        <LandingReveal
          className={`${homeLandingMasterPromoPhotoCol} ${homeLandingFeatureVisualBleed}`}
          variant="scale"
          delay={120}
          duration={1100}
        >
          <MasterLandingCabinetDemoFrame
            ariaLabel="Демо: записи в кабинете мастера"
            pageTitle="Записи"
            activeSection="appointments"
            demoLayout="main"
          >
            <MasterLandingAppointmentsDemo />
          </MasterLandingCabinetDemoFrame>
        </LandingReveal>

        <PromoSteps
          listClassName={homeLandingMasterPromoStepsMobile}
          itemClassName={homeLandingMasterPromoStepMobile}
          baseDelay={280}
        />

        <LandingReveal className={homeLandingMasterPromoCtaWrap} variant="up" delay={280}>
          <button type="button" onClick={onMasterCabinet} className={homeLandingMasterPromoCta}>
            {ctaLabel}
          </button>
        </LandingReveal>
      </div>

      <LandingReveal as="p" className={homeLandingMasterPromoCaption} variant="up" delay={120}>
        Управляйте своим успехом так же легко, как вы создаете свои шедевры.
      </LandingReveal>
    </section>
  );
};
