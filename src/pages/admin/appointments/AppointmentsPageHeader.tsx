import { AppointmentsTabSummary } from './AppointmentsTabSummary';
import type { AppointmentsTabStats } from './appointmentsTabSummaryModel';
import type { AppointmentsTabId } from './appointmentsTypes';

type Props = {
  tab: AppointmentsTabId;
  stats: AppointmentsTabStats;
};

export function AppointmentsPageHeader({ tab, stats }: Props) {
  return <AppointmentsTabSummary tab={tab} stats={stats} />;
}

export type { AppointmentsTabStats };
