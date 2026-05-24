import { AppointmentsDesktopHero, type AppointmentsTabStats } from './AppointmentsDesktopHero';
import { AppointmentsTabIntro } from './AppointmentsTabIntro';
import type { AppointmentsTabId } from './appointmentsTypes';

type Props = {
  tab: AppointmentsTabId;
  stats: AppointmentsTabStats;
};

export function AppointmentsPageHeader({ tab, stats }: Props) {
  return (
    <>
      <div className="lg:hidden">
        <AppointmentsTabIntro tab={tab} />
      </div>
      <div className="hidden lg:block">
        <AppointmentsDesktopHero tab={tab} stats={stats} />
      </div>
    </>
  );
}
