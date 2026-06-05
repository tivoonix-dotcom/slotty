import { useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterAppointmentsTab } from '../../../features/appointments/masterAppointmentLifecycle';
import { LoadingScreen } from '../../../shared/ui/LoadingVideo';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { useAdminAppointments, useAdminMasterCabinet } from '../useAdminMasterData';
import { AdminAppointmentsTab } from './AdminAppointmentsTab';

export function AdminAppointmentsSection() {
  const { appointments, persistAppointments } = useAdminAppointments();
  const { useCabinetApi, cabinetLoading, cabinetError, reloadCabinet } = useAdminMasterCabinet();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);
  const [detailTab, setDetailTab] = useState<MasterAppointmentsTab>('upcoming');

  if (useCabinetApi && cabinetLoading) {
    return <LoadingScreen className="bg-[#F1EFEF]" />;
  }

  return (
    <>
      {cabinetError ? (
        <p className="mx-4 mb-3 rounded-2xl bg-[#FFF0F0] px-4 py-2 text-center text-[13px] font-semibold text-[#9B2C2C]">
          {cabinetError}
        </p>
      ) : null}
      <AdminAppointmentsTab
        appointments={appointments}
        useRemoteList={useCabinetApi}
        onChangeAppointments={persistAppointments}
        onOpenDetail={(a, tab) => {
          setDetailAppt(a);
          setDetailTab(tab);
        }}
      />

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        tab={detailTab}
        onClose={() => setDetailAppt(null)}
        useLiveApi={useCabinetApi}
        actionsDisabled={useCabinetApi && cabinetLoading}
        onAfterAction={async () => {
          if (useCabinetApi) await reloadCabinet();
        }}
      />
    </>
  );
}
