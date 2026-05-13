import { useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminAppointments } from '../useAdminMasterData';
import { AdminAppointmentsTab } from './AdminAppointmentsTab';

export function AdminAppointmentsSection() {
  const { appointments, persistAppointments } = useAdminAppointments();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  return (
    <>
      <AdminSectionLayout title="Записи">
        <AdminAppointmentsTab
          appointments={appointments}
          onChangeAppointments={persistAppointments}
          onOpenDetail={(a) => setDetailAppt(a)}
        />
      </AdminSectionLayout>

      <AdminAppointmentDetailSheet appointment={detailAppt} onClose={() => setDetailAppt(null)} />
    </>
  );
}
