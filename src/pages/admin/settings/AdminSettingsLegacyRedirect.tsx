import { Navigate, useLocation } from 'react-router-dom';
import { mapLegacyAdminSettingsPath } from './settingsLegacyRedirects';

/** Редиректы со старых URL `/admin/settings/*`. */
export function AdminSettingsLegacyRedirect() {
  const { pathname } = useLocation();
  return <Navigate to={mapLegacyAdminSettingsPath(pathname)} replace />;
}
