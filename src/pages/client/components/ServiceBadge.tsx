import type { ReactNode } from 'react';

export type ServiceBadgeVariant =
  | 'promo'
  | 'today'
  | 'topWeek'
  | 'topMonth'
  | 'verified'
  | 'freeCancel'
  | 'new'
  | 'popular'
  | 'neutral';

const VARIANT_CLASS: Record<ServiceBadgeVariant, string> = {
  promo: 'bg-[#FFF1F4] text-[#DB2777] ring-[#FBCFE8]/80',
  today: 'bg-[#ECFDF5] text-[#047857] ring-[#A7F3D0]/60',
  topWeek: 'bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]/80',
  topMonth: 'bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]/80',
  verified: 'bg-[#EFF6FF] text-[#1D4ED8] ring-[#BFDBFE]/80',
  freeCancel: 'bg-[#ECFDF5] text-[#047857] ring-[#A7F3D0]/60',
  new: 'bg-[#F5F3FF] text-[#6D28D9] ring-[#DDD6FE]/80',
  popular: 'bg-[#FFF1F4] text-[#F47C8C] ring-[#FBCFE8]/80',
  neutral: 'bg-[#F5F5F5] text-[#6B7280] ring-[#EEEEEE]',
};

const SIZE_CLASS = {
  sm: 'px-2 py-0.5 text-[10px] font-semibold',
  md: 'px-2.5 py-1 text-[11px] font-semibold',
  lg: 'px-3 py-1.5 text-[12px] font-bold',
} as const;

type Props = {
  variant?: ServiceBadgeVariant;
  size?: keyof typeof SIZE_CLASS;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ServiceBadge({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full leading-none ring-1 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Pill на фото услуги — серый фон, без бордера. */
export function ServicePhotoBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#EBEBEB]/95 px-3 py-1.5 text-[12px] font-bold leading-none tracking-[-0.01em] text-[#374151] backdrop-blur-[2px] sm:text-[13px]">
      {children}
    </span>
  );
}
