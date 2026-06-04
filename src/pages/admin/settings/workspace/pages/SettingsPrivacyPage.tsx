import {
  HiClipboardDocumentList,
  HiDocumentText,
  HiMegaphone,
  HiShieldCheck,
  HiUserCircle,
} from 'react-icons/hi2';
import {
  LEGAL_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
  MASTER_SETTINGS_PRIVACY_PATH,
} from '../../../../../app/paths';
import { legalReturnState } from '../../../../legal/useLegalPageBack';
import { SettingsCabinetToggleRow } from '../settingsCards';
import { AccountDeletionSection } from '../privacy/AccountDeletionSection';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import {
  SettingsCabinetHero,
  SettingsCabinetRingBadge,
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetSectionTitle,
  SettingsCabinetSurface,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { DataExportSection } from '../privacy/DataExportSection';

const meta = SETTINGS_PAGE_META.privacy;

const PRIVACY_READY = 2;
const PRIVACY_TOTAL = 3;

const LEGAL_LINKS = [
  {
    to: LEGAL_PRIVACY_PATH,
    title: 'Политика конфиденциальности',
    subtitle: 'Как SLOTTY обрабатывает и защищает персональные данные',
    icon: <HiShieldCheck className="h-5 w-5" aria-hidden />,
  },
  {
    to: LEGAL_TERMS_PATH,
    title: 'Пользовательское соглашение',
    subtitle: 'Общие правила использования сервиса',
    icon: <HiDocumentText className="h-5 w-5" aria-hidden />,
  },
  {
    to: LEGAL_CONSENT_PATH,
    title: 'Согласие на обработку данных',
    subtitle: 'Текст согласия при регистрации и в кабинете',
    icon: <HiClipboardDocumentList className="h-5 w-5" aria-hidden />,
  },
] as const;

export function SettingsPrivacyPage() {
  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={`${settingsCabinetStack} pb-8`}>
        <SettingsCabinetHero
          badge={
            <SettingsCabinetRingBadge
              current={PRIVACY_READY}
              total={PRIVACY_TOTAL}
              label="готово"
            />
          }
          title="Ваши данные под контролем"
          description="Скачайте отчёт в Word с данными кабинета или ознакомьтесь с юридическими документами."
        />

        <DataExportSection />

        <section>
          <SettingsCabinetSectionTitle
            title="Видимость и маркетинг"
            description="Кто видит ваш профиль и какие рассылки вы получаете"
          />
          <SettingsCabinetSurface className="divide-y divide-[#F3F4F6] !p-0">
            <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
                <HiUserCircle className="h-5 w-5" aria-hidden />
              </span>
              <SettingsCabinetToggleRow
                title="Публичный профиль"
                description="Показывать карточку в каталоге SLOTTY"
                checked
                disabled
                className="flex-1 !px-0 !py-0"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
                <HiMegaphone className="h-5 w-5" aria-hidden />
              </span>
              <SettingsCabinetToggleRow
                title="Маркетинговые уведомления"
                description="Новости и акции SLOTTY"
                checked={false}
                disabled
                className="flex-1 !px-0 !py-0"
              />
            </div>
          </SettingsCabinetSurface>
        </section>

        <section>
          <SettingsCabinetSectionTitle
            title="Согласия и документы"
            description="Актуальные версии правил и политик"
          />
          <SettingsCabinetList>
            {LEGAL_LINKS.map((item) => (
              <SettingsCabinetListRow
                key={item.to}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                to={item.to}
                linkState={legalReturnState(MASTER_SETTINGS_PRIVACY_PATH)}
                actionLabel="Читать"
              />
            ))}
          </SettingsCabinetList>
        </section>

        <section>
          <AccountDeletionSection />
        </section>
      </div>
    </>
  );
}
