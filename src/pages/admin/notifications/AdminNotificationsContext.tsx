import { createContext, useContext, type ReactNode } from 'react';
import { useMyNotifications } from '../../../features/notifications/useMyNotifications';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';

type NotificationsState = ReturnType<typeof useMyNotifications>;

const AdminNotificationsContext = createContext<NotificationsState | null>(null);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const state = useMyNotifications(useCabinetApi, { pollIntervalMs: 45_000 });
  return (
    <AdminNotificationsContext.Provider value={state}>{children}</AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications(): NotificationsState {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider');
  }
  return ctx;
}
