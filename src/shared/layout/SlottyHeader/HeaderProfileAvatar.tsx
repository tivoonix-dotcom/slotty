import type { BackendProfile } from '../../../features/auth/types';
import {
  accountAvatarUrl,
  profileDisplayInitials,
} from '../../../features/profile/lib/profileDisplayAvatar';

const avatarImgClass =
  'block h-7 w-7 min-h-7 min-w-7 shrink-0 aspect-square rounded-full object-cover object-center';

const avatarFillClass =
  'block h-full w-full min-h-full min-w-full object-cover object-center';

type Props = {
  profile: BackendProfile | null | undefined;
  /** Заполнить круглую кнопку h-10 w-10 в хедере */
  fill?: boolean;
};

export function HeaderProfileAvatar({ profile, fill = false }: Props) {
  const src = accountAvatarUrl(profile);

  if (src) {
    return <img src={src} alt="" className={fill ? avatarFillClass : avatarImgClass} />;
  }

  const initials = profileDisplayInitials(profile?.full_name ?? '');

  return (
    <span
      className={
        fill
          ? 'flex h-full w-full items-center justify-center rounded-full bg-[#F47C8C] text-[12px] font-semibold tracking-tight text-white'
          : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F47C8C] text-[10px] font-semibold tracking-tight text-white'
      }
      aria-hidden
    >
      {initials}
    </span>
  );
}
