import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_PATH,
} from '../../../app/paths';
import { LoginMethodsPanel } from '../../../features/auth/components/LoginMethodsPanel';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ClientSettingsDocumentRedirect } from './ClientSettingsDocumentRedirect';
import { ClientSettingsDocumentsPage } from './ClientSettingsDocumentsPage';
import { ClientSettingsHeader } from './ClientSettingsHeader';
import { ClientSettingsLayout } from './ClientSettingsLayout';
import { ClientSettingsPrivacyPage } from './ClientSettingsPrivacyPage';
import { ClientSettingsSupportHub } from './ClientSettingsSupportHub';
import { ClientSettingsSystemStatusPage } from './ClientSettingsSystemStatusPage';
import { CLIENT_SETTINGS_PAGE_META } from './clientSettingsNav';

function ClientSettingsLoginMethodsSection() {
  const navigate = useNavigate();
  const { isAuthenticated, backendConfigured } = useAuth();
  const meta = CLIENT_SETTINGS_PAGE_META.security;

  return (
    <>
      <ClientSettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      {!backendConfigured ? (
        <p className="text-[14px] leading-relaxed text-[#6B7280]">Подключите API в .env, чтобы настроить вход.</p>
      ) : isAuthenticated ? (
        <LoginMethodsPanel
          mode="settings"
          appearance="okx"
          onLinked={() => void navigate(PROFILE_SETTINGS_LOGIN_METHODS_PATH)}
        />
      ) : (
        <LoginMethodsPanel
          mode="login"
          appearance="page"
          onLinked={() => void navigate(PROFILE_SETTINGS_LOGIN_METHODS_PATH)}
        />
      )}
    </>
  );
}

export function ClientSettingsPage() {
  return (
    <Routes>
      <Route element={<ClientSettingsLayout />}>
        <Route index element={<Navigate to="login-methods" replace />} />
        <Route path="login-methods" element={<ClientSettingsLoginMethodsSection />} />
        <Route path="privacy" element={<ClientSettingsPrivacyPage />} />
        <Route path="support" element={<ClientSettingsSupportHub />} />
        <Route path="system-status" element={<ClientSettingsSystemStatusPage />} />
        <Route path="documents" element={<ClientSettingsDocumentsPage />} />
        <Route path="documents/:docId" element={<ClientSettingsDocumentRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to={PROFILE_SETTINGS_PATH} replace />} />
    </Routes>
  );
}
