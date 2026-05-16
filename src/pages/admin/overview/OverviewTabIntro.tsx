import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { overviewSvodkaPhotoSrc } from './adminOverviewTheme';

export const OVERVIEW_TAB_INTRO_IMAGES = [
  overviewSvodkaPhotoSrc('обзор.webp'),
  overviewSvodkaPhotoSrc('доход.webp'),
  overviewSvodkaPhotoSrc('клиенты.webp'),
  overviewSvodkaPhotoSrc('репутация.webp'),
] as const;

const OVERVIEW_TAB_INTRO: Record<
  OverviewAnalyticsTab,
  { title: string; description: string; imageSrc: string }
> = {
  summary: {
    title: 'Обзор',
    description: 'Ключевые показатели, ближайшая запись и динамика записей за выбранный период.',
    imageSrc: overviewSvodkaPhotoSrc('обзор.webp'),
  },
  revenue: {
    title: 'Доход',
    description: 'Сумма заработка, график по дням, средний чек и оплаченные записи.',
    imageSrc: overviewSvodkaPhotoSrc('доход.webp'),
  },
  clients: {
    title: 'Клиенты',
    description: 'Новые и повторные визиты, динамика аудитории и доля постоянных клиентов.',
    imageSrc: overviewSvodkaPhotoSrc('клиенты.webp'),
  },
  reputation: {
    title: 'Репутация',
    description: 'Средний рейтинг, отзывы клиентов и ответы — всё, что влияет на доверие.',
    imageSrc: overviewSvodkaPhotoSrc('репутация.webp'),
  },
};

type Props = {
  tab: OverviewAnalyticsTab;
};

export function OverviewTabIntro({ tab }: Props) {
  const { title, description, imageSrc } = OVERVIEW_TAB_INTRO[tab];

  return (
    <AdminTabIntroBanner
      title={title}
      description={description}
      imageSrc={imageSrc}
      wrapperClassName="pb-4"
    />
  );
}
