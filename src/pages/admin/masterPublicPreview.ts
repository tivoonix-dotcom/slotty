import { getMasterPath } from '../../app/paths';

export function getMasterPublicPreviewPath(masterId: string | null | undefined): string | null {
  const id = masterId?.trim();
  if (!id || id === 'local' || id === 'demo') return null;
  return getMasterPath(id);
}

export function getMasterPublicPreviewLabel(ready: boolean): string {
  return ready ? 'Посмотреть как клиент' : 'Предпросмотр профиля';
}
