import { clientInitials } from './appointmentsFormat';

type Props = {
  name: string;
  size?: 'md' | 'lg';
};

const SIZE = {
  md: 'h-11 w-11 text-[14px]',
  lg: 'h-14 w-14 text-[16px]',
} as const;

export function AppointmentsClientAvatar({ name, size = 'md' }: Props) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] font-bold text-[#F47C8C] ${SIZE[size]}`}
      aria-hidden
    >
      {clientInitials(name)}
    </div>
  );
}
