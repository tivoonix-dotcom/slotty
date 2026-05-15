import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminScheduleTab } from './AdminScheduleTab';

export function AdminScheduleSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return (
    <AdminSectionLayout
      title="Окна для записи"
      subtitle="Добавьте свободное время, на которое клиенты смогут записаться."
    >
      <AdminScheduleTab draft={draft} onPersist={persistDraft} />
    </AdminSectionLayout>
  );
}
