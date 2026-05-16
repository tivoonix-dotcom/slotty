import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminScheduleTab } from './AdminScheduleTab';

export function AdminScheduleSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return <AdminScheduleTab draft={draft} onPersist={persistDraft} />;
}
