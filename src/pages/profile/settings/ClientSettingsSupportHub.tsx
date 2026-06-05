import { HiOutlineEnvelope } from 'react-icons/hi2';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_SYSTEM_STATUS_PATH,
} from '../../../app/paths';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import { TelegramBrandIcon } from '../../admin/settings/workspace/integrationBrandIcons';
import {
  SettingsCabinetHero,
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetRingBadge,
  settingsCabinetStack,
} from '../../admin/settings/workspace/settingsCabinetUi';
import { ClientSettingsHeader } from './ClientSettingsHeader';
import { CLIENT_SETTINGS_PAGE_META } from './clientSettingsNav';

const meta = CLIENT_SETTINGS_PAGE_META.support;

const urgentHelpPrimaryBtn =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[14px] font-bold text-white no-underline transition hover:opacity-95 active:scale-[0.98]';

export function ClientSettingsSupportHub() {
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');

  return (
    <>
      <ClientSettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={settingsCabinetStack}>
        <SettingsCabinetHero
          badge={<SettingsCabinetRingBadge current={2} total={3} label="способа" />}
          title="Центр поддержки"
          description="Напишите нам в Telegram или email — ответим по записи, аккаунту и оплате."
        />

        <SettingsCabinetList>
          <SettingsCabinetListRow
            icon={<TelegramBrandIcon size={20} />}
            title="Telegram"
            subtitle={SUPPORT_TELEGRAM}
            externalHref={tgUrl ?? undefined}
            actionLabel="Написать"
            disabled={!tgUrl}
          />
          <SettingsCabinetListRow
            icon={<HiOutlineEnvelope className="h-5 w-5" />}
            title="Email"
            subtitle={SUPPORT_EMAIL}
            externalHref={emailReady ? `mailto:${SUPPORT_EMAIL}` : undefined}
            actionLabel="Написать"
            disabled={!emailReady}
          />
          <SettingsCabinetListRow
            icon={<span className="text-[15px] font-bold text-[#ff5f7a]">?</span>}
            title="Документы и правила"
            subtitle="Условия, политика и согласия"
            to={PROFILE_SETTINGS_DOCUMENTS_PATH}
            actionLabel="Открыть"
          />
          <SettingsCabinetListRow
            icon={<span className="text-[15px] font-bold text-[#ff5f7a]">●</span>}
            title="Статус системы"
            subtitle="Доступность сервисов SLOTTY"
            to={PROFILE_SETTINGS_SYSTEM_STATUS_PATH}
            actionLabel="Смотреть"
          />
        </SettingsCabinetList>

        {tgUrl ? (
          <div className="rounded-[16px] border border-[#FCE7EC] bg-[#FFF8F9] px-4 py-4 sm:px-5">
            <p className="text-[14px] font-semibold text-[#111827]">Нужна срочная помощь?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
              Напишите в Telegram — так мы быстрее увидим обращение.
            </p>
            <a href={tgUrl} target="_blank" rel="noopener noreferrer" className={`${urgentHelpPrimaryBtn} mt-3`}>
              Открыть Telegram
            </a>
          </div>
        ) : null}
      </div>
    </>
  );
}
