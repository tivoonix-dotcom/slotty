import type { BackendProfile } from '../../auth/types';

/** Фото для карточки профиля: кабинет мастера → загруженное в профиле. */
export function profileDisplayAvatarUrl(profile: BackendProfile | null | undefined): string | null {
  if (!profile) return null;
  const header = profile.header_avatar_url?.trim();
  if (header) return header;
  const avatar = profile.avatar_url?.trim();
  return avatar || null;
}
