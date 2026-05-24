import { HiCalendarDays, HiPlusCircle, HiRectangleStack } from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { SchedulePageTab } from './scheduleTypes';

const TABS = [
  { id: 'create' as const, label: 'Создать', Icon: HiPlusCircle },
  { id: 'calendar' as const, label: 'Календарь', Icon: HiCalendarDays },
  { id: 'list' as const, label: 'Окна', Icon: HiRectangleStack },
];

type Props = {
  active: SchedulePageTab;
  onChange: (tab: SchedulePageTab) => void;
  variant?: 'mobile' | 'desktop';
};

export function ScheduleBottomTabBar({ active, onChange, variant = 'mobile' }: Props) {
  if (variant === 'desktop') {
    return (
      <AdminSegmentTabNav
        tabs={TABS}
        active={active}
        onChange={onChange}
        ariaLabel="Разделы расписания"
        mode="desktop"
      />
    );
  }

  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы расписания"
      mode="mobile"
    />
  );
}
