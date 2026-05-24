import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineEnvelope } from 'react-icons/hi2';
import { LEGAL_DOCUMENTS } from '../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_PATH,
  getProfileSettingsDocumentPath,
} from '../../../app/paths';
import { LoginMethodsPanel } from '../../../features/auth/components/LoginMethodsPanel';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ClientSettingsLayout } from './ClientSettingsLayout';
import { SettingsListCard, SettingsListRow, SettingsRowButton } from './ClientSettingsListRow';
import {
  settingsCardClass,
  settingsDocSidebarLinkActiveClass,
  settingsDocSidebarLinkClass,
  settingsLayoutGridClass,
} from './clientSettingsTheme';

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M5.43 11.47c3.66-1.6 6.1-2.65 7.32-3.15 3.48-1.45 4.2-1.7 4.67-1.7.1 0 .33.02.48.12.12.1.16.24.14.34-.02.1-.16.48-.32.94-.46 1.5-1.98 5.92-2.75 7.86-.34.74-.99 1.1-1.52 1.12-.52.02-1.35-.3-2.01-.55-.9-.33-1.62-.5-1.55-.95.03-.2.38-.4 1.05-.72Z"
      />
    </svg>
  );
}

function ClientSettingsLoginMethodsSection() {
  const navigate = useNavigate();
  const { isAuthenticated, backendConfigured } = useAuth();

  if (!backendConfigured) {
    return <p className="text-[14px] leading-relaxed text-[#6B7280]">Подключите API в .env, чтобы настроить вход.</p>;
  }

  return isAuthenticated ? (
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
  );
}

function ClientSettingsSupportSection() {
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');

  return (
    <SettingsListCard title="Поддержка">
      <SettingsListRow
        icon={<TelegramIcon />}
        title="Telegram"
        subtitle={SUPPORT_TELEGRAM}
        action={
          tgUrl ? (
            <SettingsRowButton href={tgUrl} external>
              Написать
            </SettingsRowButton>
          ) : undefined
        }
      />
      <SettingsListRow
        icon={<HiOutlineEnvelope className="h-5 w-5" />}
        title="Email"
        subtitle={SUPPORT_EMAIL}
        action={
          emailReady ? (
            <SettingsRowButton href={`mailto:${SUPPORT_EMAIL}`}>
              Написать
            </SettingsRowButton>
          ) : undefined
        }
      />
    </SettingsListCard>
  );
}

function ClientSettingsDocumentsSection() {
  const first = LEGAL_DOCUMENTS[0];
  if (!first) return null;
  return <Navigate to={getProfileSettingsDocumentPath(first.id)} replace />;
}

function ClientSettingsLegalDocSection() {
  const { docId } = useParams<{ docId: string }>();
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === docId);

  if (!doc) {
    return <Navigate to={PROFILE_SETTINGS_DOCUMENTS_PATH} replace />;
  }

  const blocks = doc.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className={settingsLayoutGridClass}>
      <nav className="flex shrink-0 flex-col gap-0.5 lg:w-[220px] xl:w-[240px]" aria-label="Документы">
        {LEGAL_DOCUMENTS.map((item) => {
          const active = item.id === doc.id;
          return (
            <Link
              key={item.id}
              to={getProfileSettingsDocumentPath(item.id)}
              className={active ? settingsDocSidebarLinkActiveClass : settingsDocSidebarLinkClass}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <article className={`min-w-0 flex-1 ${settingsCardClass} p-5 lg:p-6`}>
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">{doc.title}</h2>
        <p className="mt-2 text-[13px] font-medium text-[#9CA3AF]">{doc.updatedLabel}</p>
        <div className="mt-6 space-y-4 text-[15px] leading-[1.65] text-[#374151]">
          {blocks.map((block, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {block}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}

export function ClientSettingsPage() {
  return (
    <Routes>
      <Route element={<ClientSettingsLayout />}>
        <Route index element={<Navigate to="login-methods" replace />} />
        <Route path="login-methods" element={<ClientSettingsLoginMethodsSection />} />
        <Route path="support" element={<ClientSettingsSupportSection />} />
        <Route path="documents" element={<ClientSettingsDocumentsSection />} />
        <Route path="documents/:docId" element={<ClientSettingsLegalDocSection />} />
      </Route>
      <Route path="*" element={<Navigate to={PROFILE_SETTINGS_PATH} replace />} />
    </Routes>
  );
}
