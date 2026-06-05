import type { ReactNode } from 'react';
import { HiExclamationTriangle, HiInformationCircle } from 'react-icons/hi2';

type Props = {
  variant?: 'info' | 'warning';
  children: ReactNode;
  action?: ReactNode;
};

const VARIANTS = {
  info: {
    shell: 'border-l-[#3B4CCA] bg-[#F4F5FD] ring-[#D8DCF5]',
    iconWrap: 'bg-[#EEF0FC] text-[#3B4CCA]',
    Icon: HiInformationCircle,
  },
  warning: {
    shell: 'border-l-[#F59E0B] bg-[#FFFBEB] ring-[#FDE68A]',
    iconWrap: 'bg-[#FEF3C7] text-[#B45309]',
    Icon: HiExclamationTriangle,
  },
} as const;

export function ScheduleSheetNotice({ variant = 'info', children, action }: Props) {
  const styles = VARIANTS[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={`rounded-[14px] border-l-[3px] p-3 ring-1 sm:p-3.5 ${styles.shell}`}
      role="note"
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${styles.iconWrap}`}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug text-[#374151] sm:text-[14px]">{children}</p>
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
