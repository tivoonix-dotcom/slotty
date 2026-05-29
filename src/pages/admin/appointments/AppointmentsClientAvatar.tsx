import { apptAvatarFallback } from './adminAppointmentsTheme';
import { clientInitials } from './appointmentsFormat';
import { resolvePortraitDisplayUrl } from '../../../features/profile/lib/profileDisplayAvatar';

type Props = {
  name: string;
  photoUrl?: string | null;
  size?: 'md' | 'lg';
  /** @deprecated — все аватары в сером стиле кабинета */
  variant?: 'soft' | 'gradient';
};

const SIZE = {
  md: 'h-11 w-11 text-[14px]',
  lg: 'h-14 w-14 text-[16px]',
} as const;

export function AppointmentsClientAvatar({ name, photoUrl, size = 'md' }: Props) {
  const sizeClass = SIZE[size];
  const src = resolvePortraitDisplayUrl(photoUrl);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  return (
    <div className={`${apptAvatarFallback} ${sizeClass}`} aria-hidden>
      {clientInitials(name)}
    </div>
  );
}
