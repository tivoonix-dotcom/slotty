import {
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { OverviewSectionTabs } from './OverviewSectionTabs';

const TABS = [
  { id: 'summary' as const, label: 'Сегодня', Icon: HiChartBarSquare },
  { id: 'revenue' as const, label: 'Доход', Icon: HiWallet },
  { id: 'clients' as const, label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation' as const, label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
  /** Mobile: фиксированная панель снизу. Desktop: табы в шапке карточки. */
  variant?: 'mobile' | 'desktop';
  reputationAlertCount?: number;
};

function reputationTabBadge(count: number): string | undefined {
  if (count <= 0) return undefined;
  return count > 9 ? '9+' : String(count);
}

export function OverviewAnalyticsTabBar({
  active,
  onChange,
  variant = 'mobile',
  reputationAlertCount = 0,
}: Props) {
  if (variant === 'desktop') {
    return (
      <OverviewSectionTabs
        active={active}
        onChange={onChange}
        reputationAlertCount={reputationAlertCount}
      />
    );
  }

  const tabs = TABS.map((tab) =>
    tab.id === 'reputation'
      ? { ...tab, label: reputationAlertCount > 0 ? `${tab.label} · ${reputationTabBadge(reputationAlertCount)}` : tab.label }
      : tab,
  );

  return (
    <AdminSegmentTabNav
      tabs={tabs}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы аналитики"
      mode="mobile"
    />
  );
}
