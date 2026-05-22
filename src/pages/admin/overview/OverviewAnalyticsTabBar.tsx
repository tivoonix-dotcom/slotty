import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { OverviewSectionTabs } from './OverviewSectionTabs';

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
};

export function OverviewAnalyticsTabBar({ active, onChange }: Props) {
  return <OverviewSectionTabs active={active} onChange={onChange} />;
}
