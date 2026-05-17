import { AdminTabIntroBanner } from '../AdminTabIntroBanner';
import { appointmentsTabPhotoSrc } from './adminAppointmentsTheme';
import type { AppointmentsTabId } from './appointmentsTypes';

export const APPOINTMENTS_TAB_INTRO_IMAGES = [
  appointmentsTabPhotoSrc('11.webp'),
  appointmentsTabPhotoSrc('22.webp'),
  appointmentsTabPhotoSrc('33.webp'),
] as const;

const TAB_INTRO: Record<AppointmentsTabId, { title: string; imageSrc: string }> = {
  requests: { title: 'Заявки', imageSrc: appointmentsTabPhotoSrc('11.webp') },
  upcoming: { title: 'Предстоящие', imageSrc: appointmentsTabPhotoSrc('22.webp') },
  history: { title: 'История', imageSrc: appointmentsTabPhotoSrc('33.webp') },
};

type Props = {
  tab: AppointmentsTabId;
};

export function AppointmentsTabIntro({ tab }: Props) {
  const { title, imageSrc } = TAB_INTRO[tab];

  return <AdminTabIntroBanner title={title} imageSrc={imageSrc} wrapperClassName="pb-0" />;
}
