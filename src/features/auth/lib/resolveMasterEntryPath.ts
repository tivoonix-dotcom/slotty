import {
  ADMIN_OVERVIEW_PATH,
  BECOME_MASTER_PATH,
  getMasterRegisterPath,
} from '../../../app/paths';

type Args = {
  isAuthenticated: boolean;
  isMasterUser: boolean;
};

/** CTA «Стать мастером» / кабинет по роли и авторизации. */
export function resolveMasterEntryPath({ isAuthenticated, isMasterUser }: Args): string {
  if (isMasterUser) return ADMIN_OVERVIEW_PATH;
  if (isAuthenticated) return BECOME_MASTER_PATH;
  return getMasterRegisterPath(BECOME_MASTER_PATH);
}

/** Подпись CTA на лендинге мастера. */
export function resolveMasterEntryLabel({ isAuthenticated, isMasterUser }: Args): string {
  if (isMasterUser) return 'Кабинет мастера';
  if (isAuthenticated) return 'Продолжить регистрацию';
  return 'Стать мастером';
}

/** Подпись главной кнопки hero на лендинге мастера. */
export function resolveMasterHeroCtaLabel({ isAuthenticated, isMasterUser }: Args): string {
  if (isMasterUser) return 'Открыть кабинет';
  if (isAuthenticated) return 'Продолжить анкету мастера';
  return 'Регистрация мастера';
}
