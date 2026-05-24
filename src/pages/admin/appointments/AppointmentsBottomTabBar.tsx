import { HiArchiveBox, HiCalendarDays, HiInbox } from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { AppointmentsTabId } from './appointmentsTypes';

const TABS = [
  { id: 'requests' as const, label: 'Заявки', Icon: HiInbox },
  { id: 'upcoming' as const, label: 'Предстоящие', Icon: HiCalendarDays },
  { id: 'history' as const, label: 'История', Icon: HiArchiveBox },
];

type Props = {
  active: AppointmentsTabId;
  onChange: (tab: AppointmentsTabId) => void;
  variant?: 'mobile' | 'desktop';
};

export function AppointmentsBottomTabBar({ active, onChange, variant = 'mobile' }: Props) {
  if (variant === 'desktop') return null;

  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы записей"
      mode="mobile"
    />
  );
}
