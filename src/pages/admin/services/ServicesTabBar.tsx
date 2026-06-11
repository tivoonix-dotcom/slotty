import {
  HiClipboardDocumentList,
  HiGift,
  HiReceiptPercent,
  HiSquares2X2,
} from 'react-icons/hi2';
import { AdminSectionAttentionBadge } from '../shared/AdminSectionAttentionBadge';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { ServicesTabId } from './servicesTypes';

const TABS = [
  { id: 'catalog' as const, label: 'Каталог', Icon: HiSquares2X2 },
  { id: 'price' as const, label: 'Прайс', Icon: HiClipboardDocumentList },
  { id: 'bundles' as const, label: 'Наборы', Icon: HiGift },
  { id: 'promotions' as const, label: 'Акции', Icon: HiReceiptPercent },
];

type Props = {
  active: ServicesTabId;
  onChange: (tab: ServicesTabId) => void;
  catalogAttention?: boolean;
};

export function ServicesTabBar({
  active,
  onChange,
  catalogAttention = false,
  variant = 'mobile',
}: Props & { variant?: 'mobile' | 'desktop' }) {
  if (variant === 'desktop') {
    return null;
  }

  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы услуг"
      mode="mobile"
      renderTabBadge={(tabId) =>
        tabId === 'catalog' && catalogAttention ? (
          <AdminSectionAttentionBadge className="absolute right-2 top-1.5 z-20 h-4 w-4" />
        ) : null
      }
    />
  );
}
