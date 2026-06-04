import { useState } from 'react';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../../../constants/support';
import {
  EmailSupportIcon,
  SettingsContactCard,
  SettingsDocCard,
  SettingsHelpHero,
  SettingsLegalReader,
  TelegramSupportIcon,
  settingsHelpHeroSectionLabel,
} from '../../SettingsHelpUi';
import { settingsListDivide, settingsListTray } from '../../adminSettingsTheme';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import { SettingsSectionCard } from '../settingsUi';

const meta = SETTINGS_PAGE_META.support;

export function SettingsSupportPage() {
  const [legalId, setLegalId] = useState<LegalDocId | null>(null);
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');
  const doc = legalId ? LEGAL_DOCUMENTS.find((d) => d.id === legalId) : null;

  if (doc) {
    return (
      <>
        <SettingsHeader title={doc.title} description="Юридический документ" breadcrumb={meta.breadcrumb} />
        <SettingsSectionCard>
          <button
            type="button"
            onClick={() => setLegalId(null)}
            className="mb-4 text-[14px] font-semibold text-[#6B7280] hover:text-[#ff5f7a]"
          >
            ← К поддержке
          </button>
          <SettingsLegalReader title={doc.title} updatedLabel={doc.updatedLabel} body={doc.body} />
        </SettingsSectionCard>
      </>
    );
  }

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <div className="space-y-5">
        <SettingsSectionCard>
          <SettingsHelpHero>
            <p className={settingsHelpHeroSectionLabel}>Связаться</p>
            <div className={`mt-3 ${settingsListTray} ${settingsListDivide}`}>
              <SettingsContactCard
                tone="telegram"
                icon={<TelegramSupportIcon />}
                title="Telegram поддержки"
                value={SUPPORT_TELEGRAM}
                href={tgUrl}
                external
              />
              <SettingsContactCard
                tone="email"
                icon={<EmailSupportIcon />}
                title="Написать в поддержку"
                value={SUPPORT_EMAIL}
                href={emailReady ? `mailto:${SUPPORT_EMAIL}` : null}
              />
            </div>
          </SettingsHelpHero>
        </SettingsSectionCard>

        <SettingsSectionCard title="FAQ">
          <p className="text-[14px] text-[#6B7280]">
            Ответы на частые вопросы — в разделе справки Telegram и в документах ниже.
          </p>
        </SettingsSectionCard>

        <SettingsSectionCard title="Статус системы">
          <p className="text-[14px] text-[#6B7280]">Все основные сервисы работают в штатном режиме.</p>
        </SettingsSectionCard>

        <SettingsSectionCard title="Документы">
          <div className={`${settingsListTray} ${settingsListDivide}`}>
            {LEGAL_DOCUMENTS.map((d) => (
              <SettingsDocCard id={d.id} key={d.id} title={d.title} updatedLabel={d.updatedLabel} onOpen={() => setLegalId(d.id)} />
            ))}
          </div>
        </SettingsSectionCard>
      </div>
    </>
  );
}
