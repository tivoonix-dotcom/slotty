import type { OverviewBundleApiDto } from '../../../features/admin/api/masterOverviewApi';
import type { OverviewPeriodPreset } from './overviewAnalytics';

const bundleByPeriod = new Map<OverviewPeriodPreset, OverviewBundleApiDto>();

export function readOverviewBundleCache(period: OverviewPeriodPreset): OverviewBundleApiDto | null {
  return bundleByPeriod.get(period) ?? null;
}

export function writeOverviewBundleCache(period: OverviewPeriodPreset, bundle: OverviewBundleApiDto): void {
  bundleByPeriod.set(period, bundle);
}

export function clearOverviewBundleCache(): void {
  bundleByPeriod.clear();
}
