import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { MINI_PICTURE, OVERVIEW_WELCOME_IMAGE_SRC, overviewSvodkaPhotoSrc } from './adminOverviewTheme';

export const OVERVIEW_TAB_INTRO_IMAGES = [
  OVERVIEW_WELCOME_IMAGE_SRC,
  overviewSvodkaPhotoSrc('доход.webp'),
  overviewSvodkaPhotoSrc('клиенты.webp'),
  overviewSvodkaPhotoSrc('репутация.webp'),
  MINI_PICTURE.trust,
] as const;

const OVERVIEW_TAB_INTRO: Record<OverviewAnalyticsTab, { title: string; imageSrc: string }> = {
  summary: { title: 'Сегодня', imageSrc: OVERVIEW_WELCOME_IMAGE_SRC },
  revenue: { title: 'Доход', imageSrc: overviewSvodkaPhotoSrc('доход.webp') },
  clients: { title: 'Клиенты', imageSrc: overviewSvodkaPhotoSrc('клиенты.webp') },
  reputation: { title: 'Репутация', imageSrc: overviewSvodkaPhotoSrc('репутация.webp') },
};

type Props = {
  tab: OverviewAnalyticsTab;
};

export function OverviewTabIntro({ tab }: Props) {
  const { title, imageSrc } = OVERVIEW_TAB_INTRO[tab];
  return <AdminTabIntroBanner title={title} imageSrc={imageSrc} wrapperClassName="pb-4" />;
}
