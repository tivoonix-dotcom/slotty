import { useCallback, useState, type ReactNode } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import { AddWindowSheet } from '../schedule/AddWindowSheet';
import { CreateMonthScheduleWizard } from '../schedule/CreateMonthScheduleWizard';
import { useAddWindowSheetFlow } from '../schedule/useAddWindowSheetFlow';
import { MasterCreateServiceSheet } from '../services/MasterCreateServiceSheet';

export type OverviewQuickActionHandlers = {
  openMonthWizard: () => void;
  openAddWindow: () => void;
  openCreateService: () => void;
};

type Props = {
  draft: MasterDraft;
  useCabinetApi: boolean;
  appointments: DemoMasterAppointment[];
  onPersistDraft: (next: MasterDraft) => void;
};

export function useOverviewQuickActions({
  draft,
  useCabinetApi,
  appointments,
  onPersistDraft,
}: Props): { handlers: OverviewQuickActionHandlers; modals: ReactNode } {
  const { toast, showToast, clearToast } = useAdminToast();
  const [monthWizardOpen, setMonthWizardOpen] = useState(false);
  const [monthWizardServiceId, setMonthWizardServiceId] = useState<string | null>(null);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);

  const addWindow = useAddWindowSheetFlow({
    draft,
    useCabinetApi,
    appointments,
  });

  const openMonthWizard = useCallback((serviceId?: string | null) => {
    setMonthWizardServiceId(serviceId ?? null);
    setMonthWizardOpen(true);
  }, []);

  const closeMonthWizard = useCallback(() => {
    setMonthWizardOpen(false);
    setMonthWizardServiceId(null);
  }, []);

  const openAddWindow = useCallback(() => {
    addWindow.openAddSheet({ withoutTemplate: true });
  }, [addWindow]);

  const openCreateService = useCallback(() => {
    setCreateServiceOpen(true);
  }, []);

  const modals = (
    <>
      <AdminToast toast={toast} onDismiss={clearToast} />

      <CreateMonthScheduleWizard
        open={monthWizardOpen}
        onClose={closeMonthWizard}
        masterId={draft.masterId}
        services={draft.services
          .filter((s) => s.isActive !== false && isUuid(s.id))
          .map((s) => ({
            id: s.id,
            title: s.title,
            durationMin: s.durationMin ?? 60,
          }))}
        defaultWorkDays={draft.schedule?.workDays ?? []}
        defaultStartTime={draft.schedule?.startTime ?? '10:00'}
        defaultEndTime={draft.schedule?.endTime ?? '19:00'}
        scheduleHorizonDays={addWindow.scheduleHorizonDays}
        existingSlots={addWindow.existingSlotRanges}
        initialPeriodDays={30}
        initialServiceId={monthWizardServiceId}
        useCabinetApi={useCabinetApi}
        onCreated={() => {
          void addWindow.reloadSlots();
          showToast('Окна на месяц созданы');
        }}
      />

      <AddWindowSheet
        open={addWindow.addSheetOpen}
        onClose={addWindow.closeAddSheet}
        {...addWindow.addWindowSheetProps}
      />

      <MasterCreateServiceSheet
        open={createServiceOpen}
        onClose={() => setCreateServiceOpen(false)}
        draft={draft}
        onPersist={onPersistDraft}
        useCabinetApi={useCabinetApi}
        onCreated={(serviceId) => {
          showToast('Услуга создана');
          openMonthWizard(serviceId);
        }}
      />
    </>
  );

  return {
    handlers: {
      openMonthWizard: () => openMonthWizard(null),
      openAddWindow,
      openCreateService,
    },
    modals,
  };
}
