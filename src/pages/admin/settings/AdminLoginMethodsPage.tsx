import { Navigate } from 'react-router-dom';
import { ADMIN_SETTINGS_LOGIN_METHODS_PATH } from '../../../app/paths';

/** Редирект со старого маршрута `/admin/login-methods`. */
export function AdminLoginMethodsPage() {
  return <Navigate to={ADMIN_SETTINGS_LOGIN_METHODS_PATH} replace />;
}
