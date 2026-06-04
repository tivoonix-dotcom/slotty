import { Link } from 'react-router-dom';
import {
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
} from '../../../../../app/paths';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { readPublicAppOrigin } from '../../../../../shared/lib/masterBookingLink';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import { SettingsFormRow, SettingsSectionCard } from '../settingsUi';

const meta = SETTINGS_PAGE_META.about;

export function SettingsAboutPage() {
  const version = import.meta.env.VITE_APP_VERSION?.trim() || 'dev';
  const build = import.meta.env.MODE;
  const env = import.meta.env.PROD ? 'production' : 'development';
  const frontendUrl = readPublicAppOrigin();
  const apiUrl = getApiBaseUrl() || '—';

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <SettingsSectionCard title="Сборка">
        <SettingsFormRow title="Версия приложения" control={<span className="text-[14px] font-medium text-[#111827]">{version}</span>} />
        <SettingsFormRow title="Build" control={<span className="text-[14px] font-medium text-[#111827]">{build}</span>} />
        <SettingsFormRow title="Environment" control={<span className="text-[14px] font-medium text-[#111827]">{env}</span>} />
        <SettingsFormRow title="Frontend URL" control={<span className="break-all text-[13px] text-[#6B7280]">{frontendUrl}</span>} />
        <SettingsFormRow title="API URL" control={<span className="break-all text-[13px] text-[#6B7280]">{apiUrl}</span>} />
      </SettingsSectionCard>

      <div className="mt-5">
      <SettingsSectionCard title="Ссылки">
        <ul className="space-y-2 text-[14px] font-semibold">
          <li>
            <Link to={LEGAL_TERMS_PATH} className="text-[#ff5f7a] hover:underline">
              Пользовательское соглашение
            </Link>
          </li>
          <li>
            <Link to={LEGAL_PRIVACY_PATH} className="text-[#ff5f7a] hover:underline">
              Политика конфиденциальности
            </Link>
          </li>
          <li>
            <Link to={MASTER_SETTINGS_SUPPORT_PATH} className="text-[#ff5f7a] hover:underline">
              Поддержка
            </Link>
          </li>
        </ul>
      </SettingsSectionCard>
      </div>
    </>
  );
}
