import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import { scheduleTabPhotoSrc } from './adminScheduleTheme';
import type { SchedulePageTab } from './scheduleTypes';

export const SCHEDULE_TAB_INTRO_IMAGES = [
  scheduleTabPhotoSrc('111.webp'),
  scheduleTabPhotoSrc('222.webp'),
  scheduleTabPhotoSrc('333.webp'),
] as const;

const TAB_INTRO: Record<SchedulePageTab, { title: string; description: string; imageSrc: string }> = {
  create: {
    title: 'Создать',
    description: 'Шаблоны для быстрого добавления окон и создание слотов вручную.',
    imageSrc: scheduleTabPhotoSrc('111.webp'),
  },
  calendar: {
    title: 'Календарь',
    description: 'Смотрите график по дням: свободные окна и записи клиентов.',
    imageSrc: scheduleTabPhotoSrc('222.webp'),
  },
  list: {
    title: 'Окна',
    description: 'Все слоты в одном списке — поиск по услуге, клиенту и фильтры по статусу.',
    imageSrc: scheduleTabPhotoSrc('333.webp'),
  },
};

type Props = {
  tab: SchedulePageTab;
};

export function ScheduleTabIntro({ tab }: Props) {
  const { title, description, imageSrc } = TAB_INTRO[tab];

  return (
    <AdminTabIntroBanner
      title={title}
      description={description}
      imageSrc={imageSrc}
      wrapperClassName="pb-4"
    />
  );
}
