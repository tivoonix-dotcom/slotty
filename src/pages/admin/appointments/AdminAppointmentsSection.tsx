import { useCallback, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { useAdminAppointments } from '../useAdminMasterData';
import { AdminAppointmentsTab } from './AdminAppointmentsTab';

export function AdminAppointmentsSection() {
  const { appointments, persistAppointments } = useAdminAppointments();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  const handleUpdateAppointment = useCallback(
    (next: DemoMasterAppointment) => {
      const nextRows = appointments.map((a) => (a.id === next.id ? next : a));
      void persistAppointments(nextRows);
    },
    [appointments, persistAppointments],
  );

  return (
    <>
      <AdminAppointmentsTab
        appointments={appointments}
        onChangeAppointments={persistAppointments}
        onOpenDetail={setDetailAppt}
      />

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        onUpdateAppointment={handleUpdateAppointment}
      />
    </>
  );
}
