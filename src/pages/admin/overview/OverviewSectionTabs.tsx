import type { ComponentType } from 'react';
import {
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewAnalyticsTab } from './overviewAnalytics';

const TABS: Array<{
  id: OverviewAnalyticsTab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'summary', label: 'Обзор', Icon: HiChartBarSquare },
  { id: 'revenue', label: 'Доход', Icon: HiWallet },
  { id: 'clients', label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation', label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
  className?: string;
};

export function OverviewSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`flex w-full border-b border-[#eef0f5] ${className}`.trim()}
      aria-label="Разделы сводки"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-1 pb-3.5 pt-3.5 transition active:scale-[0.98] ${
              selected ? 'text-[#ff5f7a]' : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${selected ? 'text-[#ff5f7a]' : 'text-[#9CA3AF]'}`}
              aria-hidden
            />
            <span className="truncate text-[13px] font-semibold sm:text-[14px]">{tab.label}</span>
            {selected ? (
              <span
                className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
