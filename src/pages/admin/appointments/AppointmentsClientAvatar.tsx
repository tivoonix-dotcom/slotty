import { apptAccentIconSoft } from './adminAppointmentsTheme';
import { clientInitials } from './appointmentsFormat';

type Props = {
  name: string;
  size?: 'md' | 'lg';
  variant?: 'soft' | 'gradient';
};

const SIZE = {
  md: 'h-11 w-11 text-[14px]',
  lg: 'h-14 w-14 text-[16px]',
} as const;

export function AppointmentsClientAvatar({ name, size = 'md', variant = 'soft' }: Props) {
  const sizeClass = SIZE[size];

  if (variant === 'gradient') {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] font-bold text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)] ${sizeClass}`}
        aria-hidden
      >
        {clientInitials(name)}
      </div>
    );
  }

  return (
    <div className={`${apptAccentIconSoft} ${sizeClass}`} aria-hidden>
      {clientInitials(name)}
    </div>
  );
}
