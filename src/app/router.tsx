import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
  MASTERS_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from './paths';
import { AdminPage } from '../pages/admin/AdminPage';
import { BookingPage } from '../pages/booking/BookingPage';
import { Home } from '../pages/Home';
import { BecomeMasterPage } from '../pages/master-onboarding/BecomeMasterPage';
import { MasterProfilePage } from '../pages/master/MasterProfilePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ClientLayout } from '../pages/client/ClientLayout';
import { MastersCatalogPage } from '../pages/client/pages/MastersCatalogPage';
import { ServiceCategoryPage } from '../pages/client/pages/ServiceCategoryPage';
import { ServicesCatalogPage } from '../pages/client/pages/ServicesCatalogPage';
import { PersonalDataConsentPage } from '../pages/legal/PersonalDataConsentPage';
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage';
import { UserAgreementPage } from '../pages/legal/UserAgreementPage';
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
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
  MASTER_PATH,
  MASTERS_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from './paths';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={HUB_PATH} replace />} />
        <Route path={HUB_PATH} element={<Home />} />
        <Route element={<ClientLayout />}>
          <Route path={SERVICES_PATH} element={<ServicesCatalogPage />} />
          <Route path={`${SERVICES_PATH}/category/:categoryCode`} element={<ServiceCategoryPage />} />
          <Route path={MASTERS_PATH} element={<MastersCatalogPage />} />
          <Route path={PROFILE_PATH} element={<ProfilePage />} />
          <Route path="/master/:id" element={<MasterProfilePage />} />
          <Route path={BOOKING_PATH} element={<BookingPage />} />
        </Route>
        <Route path="/catalog" element={<Navigate to={SERVICES_PATH} replace />} />
        <Route path={`${ADMIN_PATH}/*`} element={<AdminPage />} />
        <Route path={BECOME_MASTER_PATH} element={<BecomeMasterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path={LEGAL_PRIVACY_PATH} element={<PrivacyPolicyPage />} />
        <Route path={LEGAL_PD_CONSENT_PATH} element={<PersonalDataConsentPage />} />
        <Route path={LEGAL_TERMS_PATH} element={<UserAgreementPage />} />
        <Route path="*" element={<Navigate to={HUB_PATH} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
