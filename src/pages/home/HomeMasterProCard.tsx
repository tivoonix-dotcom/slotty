import type { FC } from 'react';
import { MasterProRotatingCard } from './MasterProRotatingCard';

export type HomeMasterProCardProps = {
  cta: string;
  to: string;
};

export const HomeMasterProCard: FC<HomeMasterProCardProps> = ({ cta, to }) => {
  return (
    <MasterProRotatingCard
      priceValue="29 BYN"
      priceUnit="/ месяц"
      description="Для мастеров, которые хотят принимать записи онлайн и управлять услугами в одном кабинете."
      ctaHref={to}
      ctaLabel={cta}
    />
  );
};
