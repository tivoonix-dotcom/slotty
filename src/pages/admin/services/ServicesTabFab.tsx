import { HiPlus } from 'react-icons/hi2';

type Props = {
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  disabledTitle?: string;
  /** `schedule` — синий FAB на странице расписания. */
  variant?: 'brand' | 'schedule';
};

const FAB_CLASS: Record<NonNullable<Props['variant']>, string> = {
  brand:
    'fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_14px_36px_rgba(255,95,122,0.42)] transition hover:scale-[1.04] active:scale-[0.96] max-lg:bottom-[calc(5.75rem+1rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 lg:right-8 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100',
  schedule:
    'fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4558D4] to-[#3B4CCA] text-white shadow-[0_14px_36px_rgba(59,76,202,0.42)] transition hover:scale-[1.04] active:scale-[0.96] max-lg:bottom-[calc(5.75rem+1rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 lg:right-8 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100',
};

export function ServicesTabFab({
  ariaLabel,
  onClick,
  disabled,
  disabledTitle,
  variant = 'brand',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      className={FAB_CLASS[variant]}
      aria-label={ariaLabel}
    >
      <HiPlus className="h-7 w-7 stroke-[2.5px]" aria-hidden />
    </button>
  );
}
