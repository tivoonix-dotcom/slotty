import { ADMIN_PATH } from '../../../app/paths';
import type { ProfileCompletionSectionTarget } from '../../../features/admin/lib/profileCompletionSections';

export function buildProfileCompletionHref(target: ProfileCompletionSectionTarget): string {
  if (target.kind === 'path') return target.path;

  const params = new URLSearchParams();
  if (target.section) params.set('section', target.section);
  if (target.sheet) params.set('sheet', target.sheet);
  const q = params.toString();
  return q ? `${ADMIN_PATH}?${q}` : ADMIN_PATH;
}
