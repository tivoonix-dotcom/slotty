import {
  HiBolt,
  HiCreditCard,
  HiShieldCheck,
  HiXCircle,
} from 'react-icons/hi2';
import { catalogDesktopPanel } from './servicesCatalogTheme';

const ITEMS = [
  { icon: HiShieldCheck, label: 'Проверенные мастера' },
  { icon: HiBolt, label: 'Быстрая запись' },
  { icon: HiXCircle, label: 'Бесплатная отмена' },
  { icon: HiCreditCard, label: 'Безопасная оплата' },
] as const;

export function CatalogTrustBar() {
  return (
    <div className={`${catalogDesktopPanel} mt-4 px-5 py-4`}>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2.5 text-[13px] font-medium text-[#374151]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280]">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
