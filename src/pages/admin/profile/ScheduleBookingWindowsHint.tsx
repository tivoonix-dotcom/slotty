import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { notifFooterPrimary } from '../notifications/adminNotificationsTheme';
import { ScheduleWindowsHintBanner } from '../shared/ScheduleWindowsHintBanner';

type Props = {
  show: boolean;
};

export function ScheduleBookingWindowsHint({ show }: Props) {
  return (
    <ScheduleWindowsHintBanner show={show}>
      <Link
        to={`${ADMIN_SCHEDULE_PATH}?tab=create`}
        className={`${notifFooterPrimary} inline-flex`}
      >
        Добавить окна
        <HiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </ScheduleWindowsHintBanner>
  );
}
