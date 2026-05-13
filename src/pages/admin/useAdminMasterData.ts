export {
  AdminMasterCabinetProvider,
  useAdminMasterCabinet,
} from './AdminMasterCabinetContext';

import { useAdminMasterCabinet } from './AdminMasterCabinetContext';

export function useAdminMasterDraft() {
  const { draft, persistDraft, flushDraftToBackend, refreshDraft } = useAdminMasterCabinet();
  return { draft, persistDraft, flushDraftToBackend, refreshDraft };
}

export function useAdminAppointments() {
  const { appointments, persistAppointments } = useAdminMasterCabinet();
  return { appointments, persistAppointments };
}
