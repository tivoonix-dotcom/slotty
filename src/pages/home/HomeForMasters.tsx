import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { HUB_PATH } from '../../app/paths';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homeOutlineBtn, homePinkBtn, homeSection } from './homeTheme';

const MASTER_PREVIEW = '/photos/вымастер/1.png';

export type HomeForMastersProps = {
  masterCtaPath: string;
  masterCtaLabel: string;
};

export const HomeForMasters: FC<HomeForMastersProps> = ({ masterCtaPath, masterCtaLabel }) => {
  return (
    <section className={homeSection} aria-labelledby="home-masters-cta-heading">
      <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-start lg:gap-10 lg:text-left">
        <div className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[min(100%,20.5rem)]">
          <h2
            id="home-masters-cta-heading"
            className="text-[clamp(1.5rem,4.5vw,2rem)] font-bold leading-[1.08] tracking-[-0.03em] text-[#111827]"
          >
            Вы мастер?
          </h2>
          <p className="mt-2 text-[clamp(1.15rem,3.5vw,1.45rem)] font-bold leading-snug tracking-tight text-[#111827]">
            Принимайте записи без переписок
          </p>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px] lg:mx-0">
            Создайте профиль, добавьте услуги, настройте график и получайте заявки от клиентов в одном кабинете.
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2.5 lg:mx-0 lg:max-w-none">
            <Link to={masterCtaPath} className={`${homePinkBtn} min-h-12 w-full text-center text-[15px]`}>
              {masterCtaLabel}
            </Link>
            <a href={`${HUB_PATH}#tarify`} className={`${homeOutlineBtn} min-h-12 w-full text-center text-[15px]`}>
              Смотреть тарифы
            </a>
          </div>
        </div>

        <div className="mx-auto h-[min(19rem,42dvh)] w-full max-w-[20rem] overflow-hidden sm:max-w-[22rem] lg:mx-0 lg:h-[min(37rem,76dvh)] lg:max-w-none lg:flex-1">
          <ImageReveal
            src={MASTER_PREVIEW}
            alt="Кабинет мастера SLOTTY"
            loading="lazy"
            draggable={false}
            className="block h-auto w-full object-contain object-top"
          />
        </div>
      </div>
    </section>
  );
};
