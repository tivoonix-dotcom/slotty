import { HiPlus } from 'react-icons/hi2';
import { adminMobileTabBarFabBottom } from '../shared/adminMobileTabBarTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from '../schedule/scheduleQuickSetupAssets';

type Props = {
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  disabledTitle?: string;
  /** `schedule` — синий FAB на странице расписания. */
  variant?: 'brand' | 'schedule';
};

const FAB_SHELL =
  `fixed right-4 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white transition hover:scale-[1.04] active:scale-[0.96] max-lg:bottom-[${adminMobileTabBarFabBottom}] lg:bottom-8 lg:right-8 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100`;

const FAB_CLASS: Record<NonNullable<Props['variant']>, string> = {
  brand: `${FAB_SHELL} bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a]`,
  schedule: `${FAB_SHELL} bg-[#3B4CCA]`,
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
      {variant === 'schedule' ? (
        <>
          <span
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-0 bg-[#3B4CCA]/25" aria-hidden />
        </>
      ) : null}
      <HiPlus className="relative z-10 h-7 w-7 stroke-[2.5px]" aria-hidden />
    </button>
  );
}
