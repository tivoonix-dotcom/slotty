import { HiDocumentText, HiShieldCheck } from 'react-icons/hi2';
import { PROFILE_SETTINGS_PRIVACY_PATH } from '../../../app/paths';
import { LEGAL_DOCUMENTS } from '../../../constants/legalDocuments';
import { getLegalDocumentPagePath } from '../../../constants/legalDocumentPaths';
import { legalReturnState } from '../../legal/useLegalPageBack';
import { AccountDeletionSection } from '../../admin/settings/workspace/privacy/AccountDeletionSection';
import { DataExportSection } from '../../admin/settings/workspace/privacy/DataExportSection';
import {
  SettingsCabinetHero,
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetRingBadge,
  SettingsCabinetSectionTitle,
  settingsCabinetStack,
} from '../../admin/settings/workspace/settingsCabinetUi';
import { ClientSettingsHeader } from './ClientSettingsHeader';
import { CLIENT_SETTINGS_PAGE_META } from './clientSettingsNav';

const meta = CLIENT_SETTINGS_PAGE_META.privacy;

export function ClientSettingsPrivacyPage() {
  return (
    <>
      <ClientSettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={`${settingsCabinetStack} pb-8`}>
        <SettingsCabinetHero
          badge={<SettingsCabinetRingBadge current={2} total={3} label="готово" />}
          title="Ваши данные под контролем"
          description="Скачайте архив с данными аккаунта или запросите удаление профиля."
        />

        <DataExportSection />

        <section>
          <SettingsCabinetSectionTitle
            title="Согласия и документы"
            description="Актуальные версии правил и политик"
          />
          <SettingsCabinetList>
            {LEGAL_DOCUMENTS.map((doc) => (
              <SettingsCabinetListRow
                key={doc.id}
                icon={
                  doc.id === 'privacy' || doc.id === 'personal_data_policy' ? (
                    <HiShieldCheck className="h-5 w-5" aria-hidden />
                  ) : (
                    <HiDocumentText className="h-5 w-5" aria-hidden />
                  )
                }
                title={doc.title}
                subtitle={doc.updatedLabel}
                to={getLegalDocumentPagePath(doc.id)}
                linkState={legalReturnState(PROFILE_SETTINGS_PRIVACY_PATH)}
                actionLabel="Открыть"
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
