import {
  LEGAL_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
} from '../../../../../app/paths';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../../../../constants/support';
import { SettingsDangerZone } from '../settingsCards';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import { SettingsComingSoonBanner, SettingsFormRow, SettingsSectionCard } from '../settingsUi';
import { settingsOutlineBtn } from '../settingsWorkspaceTheme';

const meta = SETTINGS_PAGE_META.privacy;

export function SettingsPrivacyPage() {
  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <SettingsComingSoonBanner
        title="Часть настроек приватности в разработке"
        description="Экспорт данных, видимость профиля и маркетинговые рассылки появятся после подключения API. Сейчас доступны только юридические документы и обращение в поддержку."
      />

      <div className="mt-5 space-y-5">
        <SettingsSectionCard title="Экспорт данных">
          <p className="text-[14px] text-[#6B7280]">
            Запросите архив профиля, записей и настроек в формате JSON. Функция появится в следующем релизе.
          </p>
          <button type="button" disabled className={`mt-4 min-h-[40px] ${settingsOutlineBtn} cursor-not-allowed opacity-50`}>
            Запросить экспорт — скоро
          </button>
        </SettingsSectionCard>

        <SettingsSectionCard title="Видимость и маркетинг">
          <SettingsFormRow
            title="Публичный профиль"
            description="Показывать карточку в каталоге SLOTTY"
            control={
              <label className="inline-flex cursor-not-allowed items-center gap-2 opacity-50">
                <input type="checkbox" checked disabled className="h-4 w-4 rounded" aria-disabled />
                <span className="text-[13px] text-[#6B7280]">Скоро</span>
              </label>
            }
          />
          <SettingsFormRow
            title="Маркетинговые уведомления"
            description="Новости и акции SLOTTY"
            control={
              <label className="inline-flex cursor-not-allowed items-center gap-2 opacity-50">
                <input type="checkbox" checked disabled className="h-4 w-4 rounded" aria-disabled />
                <span className="text-[13px] text-[#6B7280]">Скоро</span>
              </label>
            }
          />
        </SettingsSectionCard>

        <SettingsSectionCard title="Согласия">
          <ul className="space-y-2 text-[14px]">
            <li>
              <Link to={LEGAL_PRIVACY_PATH} className="font-semibold text-[#ff5f7a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30">
                Политика конфиденциальности
              </Link>
            </li>
            <li>
              <Link to={LEGAL_TERMS_PATH} className="font-semibold text-[#ff5f7a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30">
                Пользовательское соглашение
              </Link>
            </li>
            <li>
              <Link to={LEGAL_CONSENT_PATH} className="font-semibold text-[#ff5f7a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30">
                Согласие на обработку данных
              </Link>
            </li>
          </ul>
        </SettingsSectionCard>

        <SettingsDangerZone
          disabled
          hint={`Для удаления аккаунта напишите на ${SUPPORT_EMAIL} — мы обработаем запрос вручную.`}
        />
      </div>
    </>
  );
}
