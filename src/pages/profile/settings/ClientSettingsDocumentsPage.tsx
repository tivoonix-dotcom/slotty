import { HiDocumentText, HiShieldCheck } from 'react-icons/hi2';
import { PROFILE_SETTINGS_DOCUMENTS_PATH } from '../../../app/paths';
import { LEGAL_DOCUMENTS } from '../../../constants/legalDocuments';
import { getLegalDocumentPagePath } from '../../../constants/legalDocumentPaths';
import { legalReturnState } from '../../legal/useLegalPageBack';
import {
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetSectionTitle,
  settingsCabinetStack,
} from '../../admin/settings/workspace/settingsCabinetUi';
import { ClientSettingsHeader } from './ClientSettingsHeader';
import { CLIENT_SETTINGS_PAGE_META } from './clientSettingsNav';

const meta = CLIENT_SETTINGS_PAGE_META.documents;
const returnState = legalReturnState(PROFILE_SETTINGS_DOCUMENTS_PATH);

export function ClientSettingsDocumentsPage() {
  return (
    <>
      <ClientSettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={settingsCabinetStack}>
        <SettingsCabinetSectionTitle
          title="Юридические документы"
          description="Откроются на отдельных страницах SLOTTY — можно вернуться назад в настройки."
        />
        <SettingsCabinetList>
          {LEGAL_DOCUMENTS.map((doc) => (
            <SettingsCabinetListRow
              key={doc.id}
              icon={
                doc.id === 'privacy' || doc.id === 'personal_data_policy' || doc.id === 'consent' ? (
                  <HiShieldCheck className="h-5 w-5" aria-hidden />
                ) : (
                  <HiDocumentText className="h-5 w-5" aria-hidden />
                )
              }
              title={doc.title}
              subtitle={doc.updatedLabel}
              to={getLegalDocumentPagePath(doc.id)}
              linkState={returnState}
              actionLabel="Открыть"
            />
          ))}
        </SettingsCabinetList>
      </div>
    </>
  );
}
