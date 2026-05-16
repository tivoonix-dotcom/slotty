import { useState } from 'react';
import { ADMIN_APPOINTMENTS_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { useAdminAppointments, useAdminMasterDraft } from '../useAdminMasterData';
import { AdminOverviewTab } from './AdminOverviewTab';

export function AdminOverviewSection() {
  const { draft } = useAdminMasterDraft();
  const { appointments, persistAppointments } = useAdminAppointments();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  return (
    <>
      <AdminOverviewTab
        draft={draft}
        appointments={appointments}
        appointmentsPath={ADMIN_APPOINTMENTS_PATH}
        onOpenAppointment={(a) => setDetailAppt(a)}
      />

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        onUpdateAppointment={(next) => {
          persistAppointments(appointments.map((a) => (a.id === next.id ? next : a)));
        }}
      />
    </>
  );
}
