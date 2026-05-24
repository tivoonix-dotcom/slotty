import { useState } from 'react';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import { settingsPanel } from './adminSettingsTheme';
import {
  EmailSupportIcon,
  SettingsBackButton,
  SettingsContactCard,
  SettingsDocCard,
  SettingsHelpIntro,
  SettingsLegalReader,
  SettingsSectionHeading,
  TelegramSupportIcon,
} from './SettingsHelpUi';

const settingsPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98]';

const settingsOutlineBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[16px] border border-[#FDE8ED] bg-white px-4 text-[14px] font-semibold text-[#ff5f7a] transition hover:bg-[#FFF9FB] active:scale-[0.98]';

export function SettingsHelpSection() {
  const [legalId, setLegalId] = useState<LegalDocId | null>(null);
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');

  const doc = legalId ? LEGAL_DOCUMENTS.find((d) => d.id === legalId) : null;

  if (doc) {
    return (
      <section className={settingsPanel}>
        <SettingsBackButton onClick={() => setLegalId(null)} label="К справке" />
        <SettingsLegalReader title={doc.title} updatedLabel={doc.updatedLabel} body={doc.body} />
      </section>
    );
  }

  return (
    <section className={`${settingsPanel} space-y-8`}>
      <SettingsHelpIntro />

      <div className="space-y-4">
        <SettingsSectionHeading
          title="Поддержка"
          description="Ответим по кабинету, расписанию, записям и оплате Pro."
        />
        <div className="flex flex-col gap-3">
          <SettingsContactCard
            tone="telegram"
            icon={<TelegramSupportIcon />}
            title="Telegram"
            value={SUPPORT_TELEGRAM}
            hint={tgUrl ? 'Обычно отвечаем в течение дня' : 'Укажите @username в константах поддержки'}
            href={tgUrl}
            external
          />
          <SettingsContactCard
            tone="email"
            icon={<EmailSupportIcon />}
            title="Email"
            value={SUPPORT_EMAIL}
            hint={emailReady ? 'Для длинных вопросов и вложений' : 'Укажите рабочий email в константах'}
            href={emailReady ? `mailto:${SUPPORT_EMAIL}` : null}
          />
        </div>

        {tgUrl ? (
          <a href={tgUrl} target="_blank" rel="noopener noreferrer" className={settingsPrimaryBtn}>
            Написать в Telegram
          </a>
        ) : (
          <p className="text-[14px] leading-relaxed text-[#6B7280]">
            Добавьте реальный Telegram в{' '}
            <code className="rounded-md bg-[#f6f7fb] px-1.5 py-0.5 text-[13px] text-[#374151]">support.ts</code>,
            чтобы появилась кнопка связи.
          </p>
        )}

        {emailReady ? (
          <a href={`mailto:${SUPPORT_EMAIL}`} className={settingsOutlineBtn}>
            Написать на email
          </a>
        ) : null}
      </div>

      <div className="space-y-4">
        <SettingsSectionHeading
          title="Документы"
          description="Пользовательское соглашение, конфиденциальность и правила сервиса."
        />
        <ul className="flex flex-col gap-3">
          {LEGAL_DOCUMENTS.map((d) => (
            <li key={d.id}>
              <SettingsDocCard
                id={d.id}
                title={d.title}
                updatedLabel={d.updatedLabel}
                onOpen={() => setLegalId(d.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
