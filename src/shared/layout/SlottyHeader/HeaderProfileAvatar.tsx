import { HiUser } from 'react-icons/hi2';
import type { BackendProfile } from '../../../features/auth/types';

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
  const src = profile?.header_avatar_url?.trim() || null;

  if (!src) {
    return <HiUser className="h-5 w-5 shrink-0" aria-hidden />;
  }

  return <img src={src} alt="" className={fill ? avatarFillClass : avatarImgClass} />;
}
