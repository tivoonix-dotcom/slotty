import { ScheduleDesktopHero } from './ScheduleDesktopHero';
import { ScheduleTabIntro } from './ScheduleTabIntro';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import type { SchedulePageTab } from './scheduleTypes';

type Props = {
  activeTab: SchedulePageTab;
  metrics: ScheduleTabMetrics;
};

export function SchedulePageHeader({ activeTab, metrics }: Props) {
  return (
    <>
      <div className="lg:hidden">
        <ScheduleTabIntro tab={activeTab} />
      </div>
      <div className="hidden lg:block">
        <ScheduleDesktopHero tab={activeTab} metrics={metrics} />
      </div>
    </>
  );
}
