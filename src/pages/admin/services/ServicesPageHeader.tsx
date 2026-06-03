import { ServicesDesktopHero } from './ServicesDesktopHero';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
  metrics: ServicesTabMetrics;
  extrasLocked?: boolean;
};

export function ServicesPageHeader({ activeTab, metrics, extrasLocked = false }: Props) {
  const hideHero =
    extrasLocked && (activeTab === 'bundles' || activeTab === 'promotions');
  if (hideHero) return null;

  return (
    <>
      <div className="pb-4 lg:hidden">
        <ServicesDesktopHero tab={activeTab} metrics={metrics} extrasLocked={extrasLocked} />
      </div>
      <div className="hidden lg:block">
        <ServicesDesktopHero tab={activeTab} metrics={metrics} extrasLocked={extrasLocked} />
      </div>
    </>
  );
}
