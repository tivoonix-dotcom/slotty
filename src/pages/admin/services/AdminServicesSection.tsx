import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminServicesTab } from './AdminServicesTab';

export function AdminServicesSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return <AdminServicesTab draft={draft} onPersist={persistDraft} />;
}
