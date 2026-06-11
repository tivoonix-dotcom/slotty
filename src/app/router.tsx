import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HELP_PATH,
  HUB_PATH,
  LEGAL_CONSENT_PATH,
  MASTER_SETTINGS_SUPPORT_DOCS_PATH,
  LEGAL_CROSS_BORDER_PATH,
  LEGAL_MASTER_TERMS_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_PUBLIC_OFFER_PATH,
  LEGAL_REFUND_PATH,
  LEGAL_TERMS_PATH,
  PAYMENT_SUCCESS_PATH,
  PAYMENT_FAIL_PATH,
  MASTERS_PATH,
  PROFILE_PATH,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PATH,
  SERVICES_PATH,
} from './paths';
import { AdminPage } from '../pages/admin/AdminPage';
import { MasterSettingsPage } from '../pages/admin/settings/MasterSettingsPage';
import { PlatformAdminPage } from '../pages/platform-admin/PlatformAdminPage';
import { BookingPage } from '../pages/booking/BookingPage';
import { ClientAppointmentReviewPage } from '../pages/booking/ClientAppointmentReviewPage';
import { ClientBookingDetailPage } from '../pages/booking/ClientBookingDetailPage';
import { MasterBookingDetailPage } from '../pages/booking/MasterBookingDetailPage';
import { Home } from '../pages/Home';
import { BecomeMasterPage } from '../pages/master-onboarding/BecomeMasterPage';
import { MasterProfilePage } from '../pages/master/MasterProfilePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ClientNotificationsPage } from '../pages/profile/notifications/ClientNotificationsPage';
import { ClientSettingsPage } from '../pages/profile/settings/ClientSettingsPage';
import { ClientLayout } from '../pages/client/ClientLayout';
import { ServiceCategoryPage } from '../pages/client/pages/ServiceCategoryPage';
import { ServicesCatalogPage } from '../pages/client/pages/ServicesCatalogPage';
import { PersonalDataConsentLegacyRedirect, PersonalDataConsentPage } from '../pages/legal/PersonalDataConsentPage';
import { CrossBorderConsentPage } from '../pages/legal/CrossBorderConsentPage';
import { MasterTermsPage } from '../pages/legal/MasterTermsPage';
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage';
import { UnsubscribeNewsletterPage } from '../pages/UnsubscribeNewsletterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PublicStatusPage } from '../pages/status/PublicStatusPage';
import { UserAgreementPage } from '../pages/legal/UserAgreementPage';
import { PaymentInfoPage } from '../pages/legal/PaymentInfoPage';
import { RefundPolicyPage } from '../pages/legal/RefundPolicyPage';
import { PublicOfferPage } from '../pages/legal/PublicOfferPage';
import { PaymentSuccessPage } from '../pages/payment/PaymentSuccessPage';
import { PaymentFailPage } from '../pages/payment/PaymentFailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { MasterLoginPage } from '../pages/auth/MasterLoginPage';
import { MasterRegisterPage } from '../pages/auth/MasterRegisterPage';
import { MasterLanding } from '../pages/MasterLanding';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { GoogleOAuthDonePage } from '../pages/auth/GoogleOAuthDonePage';
import { GoogleLinkPage } from '../pages/auth/GoogleLinkPage';
import {
  FORGOT_PASSWORD_PATH,
  GOOGLE_OAUTH_DONE_PATH,
  GOOGLE_LINK_PATH,
  LOGIN_PATH,
  MASTER_LOGIN_PATH,
  MASTER_REGISTER_PATH,
  MASTER_START_PATH,
  RESET_PASSWORD_PATH,
  UNSUBSCRIBE_NEWSLETTER_PATH,
  VERIFY_EMAIL_PATH,
} from './paths';

/** Старый URL каталога мастеров — ведём в каталог услуг. */
function LegacyMastersRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${SERVICES_PATH}${search}`} replace />;
}

export {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PATH,
  ADMIN_BILLING_PATH,
  ADMIN_NOTIFICATIONS_PATH,
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
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PATH,
  SERVICES_PATH,
} from './paths';

export function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to={HUB_PATH} replace />} />
        <Route path={HUB_PATH} element={<Home />} />
        <Route element={<ClientLayout />}>
          <Route path={SERVICES_PATH} element={<ServicesCatalogPage />} />
          <Route path={`${SERVICES_PATH}/category/:categoryCode`} element={<ServiceCategoryPage />} />
          <Route path={MASTERS_PATH} element={<LegacyMastersRedirect />} />
          <Route path="/client/appointments/:bookingCode/review" element={<ClientAppointmentReviewPage />} />
          <Route path="/client/appointments/:bookingCode" element={<ClientBookingDetailPage />} />
          <Route path="/master/appointments/:bookingCode" element={<MasterBookingDetailPage />} />
          <Route path={PROFILE_PATH} element={<ProfilePage />} />
          <Route path={PROFILE_NOTIFICATIONS_PATH} element={<ClientNotificationsPage />} />
          <Route path={`${PROFILE_SETTINGS_PATH}/*`} element={<ClientSettingsPage />} />
          <Route path="/master/:id" element={<MasterProfilePage />} />
          <Route path={BOOKING_PATH} element={<BookingPage />} />
        </Route>
        <Route path="/catalog" element={<Navigate to={SERVICES_PATH} replace />} />
        <Route path="/master/settings/*" element={<MasterSettingsPage />} />
        <Route path={`${ADMIN_PATH}/*`} element={<AdminPage />} />
        <Route path="/platform-admin/*" element={<PlatformAdminPage />} />
        <Route path={LOGIN_PATH} element={<LoginPage />} />
        <Route path={MASTER_START_PATH} element={<MasterLanding />} />
        <Route path={MASTER_LOGIN_PATH} element={<MasterLoginPage />} />
        <Route path={MASTER_REGISTER_PATH} element={<MasterRegisterPage />} />
        <Route path={VERIFY_EMAIL_PATH} element={<VerifyEmailPage />} />
        <Route path={GOOGLE_OAUTH_DONE_PATH} element={<GoogleOAuthDonePage />} />
        <Route path={GOOGLE_LINK_PATH} element={<GoogleLinkPage />} />
        <Route path={FORGOT_PASSWORD_PATH} element={<ForgotPasswordPage />} />
        <Route path={RESET_PASSWORD_PATH} element={<ResetPasswordPage />} />
        <Route path={BECOME_MASTER_PATH} element={<BecomeMasterPage />} />
        <Route path="/settings" element={<Navigate to={PROFILE_SETTINGS_PATH} replace />} />
        <Route path={HELP_PATH} element={<Navigate to={MASTER_SETTINGS_SUPPORT_DOCS_PATH} replace />} />
        <Route path="/doc/SLOTTY_politika_pd.pdf" element={<Navigate to={LEGAL_PRIVACY_PATH} replace />} />
        <Route path="/doc/SLOTTY_soglasie_pd.pdf" element={<Navigate to={LEGAL_CONSENT_PATH} replace />} />
        <Route path={LEGAL_PRIVACY_PATH} element={<PrivacyPolicyPage />} />
        <Route path={LEGAL_CONSENT_PATH} element={<PersonalDataConsentPage />} />
        <Route path={LEGAL_PD_CONSENT_PATH} element={<PersonalDataConsentLegacyRedirect />} />
        <Route path={LEGAL_CROSS_BORDER_PATH} element={<CrossBorderConsentPage />} />
        <Route path={LEGAL_MASTER_TERMS_PATH} element={<MasterTermsPage />} />
        <Route path={LEGAL_TERMS_PATH} element={<UserAgreementPage />} />
        <Route path={LEGAL_PAYMENT_PATH} element={<PaymentInfoPage />} />
        <Route path={LEGAL_REFUND_PATH} element={<RefundPolicyPage />} />
        <Route path={LEGAL_PUBLIC_OFFER_PATH} element={<PublicOfferPage />} />
        <Route path={PAYMENT_SUCCESS_PATH} element={<PaymentSuccessPage />} />
        <Route path={PAYMENT_FAIL_PATH} element={<PaymentFailPage />} />
        <Route path={UNSUBSCRIBE_NEWSLETTER_PATH} element={<UnsubscribeNewsletterPage />} />
        <Route path="/status" element={<PublicStatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
