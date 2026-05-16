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
  Icon: typeof HiChartBarSquare;
}> = [
  { id: 'summary', label: 'Обзор', Icon: HiChartBarSquare },
  { id: 'revenue', label: 'Доход', Icon: HiWallet },
  { id: 'clients', label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation', label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
};

export function OverviewAnalyticsTabBar({ active, onChange }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
      <nav
        className="pointer-events-auto flex h-[72px] w-full max-w-[460px] items-stretch gap-1 rounded-[26px] border border-white/80 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.16)] backdrop-blur-xl"
        aria-label="Разделы аналитики"
      >
        {TABS.map(({ id, label, Icon }) => {
          const selected = active === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 transition duration-200 active:scale-[0.96] ${
                selected
                  ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.10)]'
                  : 'text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
              }`}
            >
              <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
              <span
                className={`max-w-full truncate text-[10px] font-bold leading-none sm:text-[11px] ${
                  selected ? 'text-[#F47C8C]' : ''
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}