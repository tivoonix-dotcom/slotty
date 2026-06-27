import { HiPlus } from 'react-icons/hi2';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

const SIZE_CLASS = {
  sm: 'h-8 w-8 rounded-[8px]',
  md: 'h-9 w-9 rounded-[10px]',
} as const;

const ICON_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const;

/** Квадратный «+» в фирменном розовом — как FAB на странице услуг. */
export function ServicesPhotoPlusIcon({ className = '', size = 'md' }: Props) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white ${SIZE_CLASS[size]} ${className}`.trim()}
      aria-hidden
    >
      <HiPlus className={`stroke-[2.5px] ${ICON_CLASS[size]}`} />
    </span>
  );
}
