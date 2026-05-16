import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminScheduleTab } from './AdminScheduleTab';

export function AdminScheduleSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return (
    <AdminSectionLayout
      title="Расписание"
      subtitle="Добавляйте свободные окна для записи клиентов и управляйте графиком в календаре."
    >
      <AdminScheduleTab draft={draft} onPersist={persistDraft} />
    </AdminSectionLayout>
  );
}
