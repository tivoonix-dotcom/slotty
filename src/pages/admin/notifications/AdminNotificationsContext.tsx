import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMyNotifications } from '../../../features/notifications/useMyNotifications';
import { computeMasterNotificationStats } from './masterNotificationModel';
import { useAuth } from '../../../features/auth/AuthProvider';
import { hasMasterCabinetAccess } from '../../../features/auth/lib/hasMasterCabinetAccess';
import { getApiBaseUrl } from '../../../shared/api/backendClient';

type NotificationsState = ReturnType<typeof useMyNotifications> & {
  actionRequiredCount: number;
  bellCount: number;
  hasAttention: boolean;
};

const AdminNotificationsContext = createContext<NotificationsState | null>(null);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const useCabinetApi = Boolean(getApiBaseUrl() && hasMasterCabinetAccess(profile));
  const state = useMyNotifications(useCabinetApi, { pollIntervalMs: 45_000, audience: 'master' });
  const actionRequiredCount = useMemo(
    () => computeMasterNotificationStats(state.notifications).actionRequired,
    [state.notifications],
  );
  /** На колокольчике — только непрочитанные; «требуют действия» видны на странице уведомлений. */
  const bellCount = state.unreadCount;
  const enriched: NotificationsState = {
    ...state,
    actionRequiredCount,
    bellCount,
    hasAttention: state.unreadCount > 0 || actionRequiredCount > 0,
  };
  return (
    <AdminNotificationsContext.Provider value={enriched}>{children}</AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications(): NotificationsState {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider');
  }
  return ctx;
}
