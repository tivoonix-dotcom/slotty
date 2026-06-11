import { ADMIN_PATH, MASTER_START_PATH } from '../../../app/paths';

type Args = {
  isAuthenticated: boolean;
  isMasterUser: boolean;
};

/** CTA «Стать мастером» / кабинет по роли и авторизации. */
export function resolveMasterEntryPath({ isMasterUser }: Args): string {
  if (isMasterUser) return ADMIN_PATH;
  return MASTER_START_PATH;
}
