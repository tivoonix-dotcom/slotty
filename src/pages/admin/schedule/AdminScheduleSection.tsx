import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminScheduleTab } from './AdminScheduleTab';

export function AdminScheduleSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return (
    <AdminSectionLayout title="График работы">
      <AdminScheduleTab draft={draft} onPersist={persistDraft} />
    </AdminSectionLayout>
  );
}
