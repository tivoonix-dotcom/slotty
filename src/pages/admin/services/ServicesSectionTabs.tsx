import type { ComponentType } from 'react';
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
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'catalog', label: 'Каталог', Icon: HiSquares2X2 },
  { id: 'price', label: 'Прайс', Icon: HiClipboardDocumentList },
  { id: 'bundles', label: 'Наборы', Icon: HiGift },
  { id: 'promotions', label: 'Акции', Icon: HiReceiptPercent },
];

type Props = {
  active: ServicesTabId;
  onChange: (tab: ServicesTabId) => void;
  className?: string;
};

export function ServicesSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`flex w-full border-b border-[#eef0f5] ${className}`.trim()}
      aria-label="Разделы услуг"
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
