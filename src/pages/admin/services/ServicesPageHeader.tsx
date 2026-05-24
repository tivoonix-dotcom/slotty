import { ServicesDesktopHero } from './ServicesDesktopHero';
import { ServicesTabIntro } from './ServicesTabIntro';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
  metrics: ServicesTabMetrics;
};

export function ServicesPageHeader({ activeTab, metrics }: Props) {
  return (
    <>
      <div className="lg:hidden">
        <ServicesTabIntro tab={activeTab} />
      </div>
      <div className="hidden lg:block">
        <ServicesDesktopHero tab={activeTab} metrics={metrics} />
      </div>
    </>
  );
}
