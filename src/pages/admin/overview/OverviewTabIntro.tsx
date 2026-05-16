import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { overviewSvodkaPhotoSrc } from './adminOverviewTheme';

export const OVERVIEW_TAB_INTRO_IMAGES = [
  overviewSvodkaPhotoSrc('обзор.webp'),
  overviewSvodkaPhotoSrc('доход.webp'),
  overviewSvodkaPhotoSrc('клиенты.webp'),
  overviewSvodkaPhotoSrc('репутация.webp'),
] as const;

const OVERVIEW_TAB_INTRO: Record<OverviewAnalyticsTab, { title: string; imageSrc: string }> = {
  summary: { title: 'Обзор', imageSrc: overviewSvodkaPhotoSrc('обзор.webp') },
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
