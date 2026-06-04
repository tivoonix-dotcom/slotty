import { Navigate } from 'react-router-dom';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../../app/paths';

/** Редирект со старого маршрута `/admin/login-methods`. */
export function AdminLoginMethodsPage() {
  return <Navigate to={MASTER_SETTINGS_SECURITY_PATH} replace />;
}
