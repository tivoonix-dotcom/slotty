import { useState } from 'react';
import { ADMIN_APPOINTMENTS_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { useAdminAppointments, useAdminMasterCabinet, useAdminMasterDraft } from '../useAdminMasterData';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import { AdminOverviewTab } from './AdminOverviewTab';

export function AdminOverviewSection() {
  const { draft, persistDraft } = useAdminMasterDraft();
  const { useCabinetApi, reloadCabinet } = useAdminMasterCabinet();
  const { appointments } = useAdminAppointments();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  return (
    <>
      <AdminOverviewTab
        draft={draft}
        appointments={appointments}
        appointmentsPath={ADMIN_APPOINTMENTS_PATH}
        useCabinetApi={useCabinetApi}
        onPersistDraft={persistDraft}
        onOpenAppointment={(a) => setDetailAppt(a)}
      />

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        useLiveApi={useCabinetApi}
        onAfterAction={async () => {
          afterBookingMutation();
          if (useCabinetApi) await reloadCabinet();
        }}
      />
    </>
  );
}
