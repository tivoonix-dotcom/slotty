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
      <div className="px-4 pb-10">
        <h1 className="pt-1 text-[26px] font-semibold tracking-[-0.05em] text-neutral-950">Сводка</h1>
        <div className="mt-6">
          <AdminOverviewTab
            draft={draft}
            appointments={appointments}
            appointmentsPath={ADMIN_APPOINTMENTS_PATH}
            onOpenAppointment={(a) => setDetailAppt(a)}
          />
        </div>
      </div>

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
