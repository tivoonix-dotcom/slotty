import {
  HiClipboardDocumentList,
  HiGift,
  HiReceiptPercent,
  HiSquares2X2,
} from 'react-icons/hi2';
import type { ServicesTabId } from './servicesTypes';

const TABS: Array<{
  id: ServicesTabId;
  label: string;
  Icon: typeof HiSquares2X2;
}> = [
  { id: 'catalog', label: 'Каталог', Icon: HiSquares2X2 },
  { id: 'price', label: 'Прайс', Icon: HiClipboardDocumentList },
  { id: 'bundles', label: 'Наборы', Icon: HiGift },
  { id: 'promotions', label: 'Акции', Icon: HiReceiptPercent },
];

type Props = {
  active: ServicesTabId;
  onChange: (tab: ServicesTabId) => void;
};

export function ServicesTabBar({ active, onChange }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
      <nav
        className="pointer-events-auto flex h-[72px] w-full max-w-[460px] items-stretch gap-1 rounded-[26px] border border-white/90 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl"
        aria-label="Разделы услуг"
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
