import { useEffect, useState } from 'react';
import { HiUser } from 'react-icons/hi2';
import { apptAvatarFallback } from './adminAppointmentsTheme';
import { clientInitials } from './appointmentsFormat';
import {
  isGeneratedPlaceholderAvatarUrl,
  resolvePortraitDisplayUrl,
} from '../../../features/profile/lib/profileDisplayAvatar';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';

type Props = {
  name: string;
  phone?: string | null;
  photoUrl?: string | null;
  size?: 'md' | 'lg';
  /** @deprecated — все аватары в сером стиле кабинета */
  variant?: 'soft' | 'gradient';
  /** В отзывах показываем OAuth-портрет (Google/Telegram), в записях — только загруженные. */
  portraitScope?: 'appointment' | 'review';
};

const SIZE = {
  md: 'h-12 w-12 text-[15px]',
  lg: 'h-14 w-14 text-[16px]',
} as const;

const ICON_SIZE = {
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

function resolveAvatarSrc(
  photoUrl: string | null | undefined,
  portraitScope: Props['portraitScope'],
): string | null {
  const raw = photoUrl?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return null;
  if (portraitScope === 'review') {
    return optimizeAvatarUrl(raw, 256) || raw;
  }
  return resolvePortraitDisplayUrl(raw);
}

export function AppointmentsClientAvatar({
  name,
  phone,
  photoUrl,
  size = 'md',
  portraitScope = 'appointment',
}: Props) {
  const sizeClass = SIZE[size];
  const src = resolveAvatarSrc(photoUrl, portraitScope);
  const initials = clientInitials(name, phone);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  return (
    <div className={`${apptAvatarFallback} ${sizeClass}`} aria-hidden>
      {initials ? (
        initials
      ) : (
        <HiUser className={`${ICON_SIZE[size]} text-[#9CA3AF]`} aria-hidden />
      )}
    </div>
  );
}
