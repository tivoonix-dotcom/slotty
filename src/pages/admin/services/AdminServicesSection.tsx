import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminServicesTab } from './AdminServicesTab';

export function AdminServicesSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return (
    <AdminSectionLayout
      title="Услуги"
      subtitle="Цены, длительность и описания для клиентов."
    >
      <AdminServicesTab draft={draft} onPersist={persistDraft} />
    </AdminSectionLayout>
  );
}
