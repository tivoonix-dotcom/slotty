import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from './paths';
import { AdminPage } from '../pages/admin/AdminPage';
import { BookingPage } from '../pages/booking/BookingPage';
import { Home } from '../pages/Home';
import { BecomeMasterPage } from '../pages/master-onboarding/BecomeMasterPage';
import { MasterProfilePage } from '../pages/master/MasterProfilePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ServicesPage } from '../pages/services/ServicesPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  getBookingPath,
  getMasterPath,
  getProfilePath,
  HUB_PATH,
  MASTER_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from './paths';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={HUB_PATH} replace />} />
        <Route path={HUB_PATH} element={<Home />} />
        <Route path={SERVICES_PATH} element={<ServicesPage />} />
        <Route path={PROFILE_PATH} element={<ProfilePage />} />
        <Route path="/master/:id" element={<MasterProfilePage />} />
        <Route path={BOOKING_PATH} element={<BookingPage />} />
        <Route path={`${ADMIN_PATH}/*`} element={<AdminPage />} />
        <Route path={BECOME_MASTER_PATH} element={<BecomeMasterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={HUB_PATH} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
