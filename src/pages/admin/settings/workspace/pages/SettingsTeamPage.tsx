import {
  HiClipboardDocumentList,
  HiEnvelope,
  HiShieldCheck,
  HiUserGroup,
  HiUserPlus,
  HiWrenchScrewdriver,
} from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_SUPPORT_CONTACT_PATH } from '../../../../../app/paths';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import {
  SettingsCabinetFeatureCard,
  SettingsCabinetHero,
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetProgressCard,
  SettingsCabinetRingBadge,
  SettingsCabinetSectionTitle,
  SettingsCabinetStatusPill,
  settingsCabinetOutlineBtn,
  settingsCabinetStack,
} from '../settingsCabinetUi';

const meta = SETTINGS_PAGE_META.team;

const TEAM_READY = 0;
const TEAM_TOTAL = 4;

const TEAM_ROLES = [
  {
    id: 'owner',
    icon: <HiShieldCheck className="h-5 w-5" aria-hidden />,
    title: 'Владелец',
    subtitle: 'Полный доступ к кабинету, биллингу и настройкам',
  },
  {
    id: 'admin',
    icon: <HiUserGroup className="h-5 w-5" aria-hidden />,
    title: 'Администратор',
    subtitle: 'Записи, клиенты, услуги и уведомления без доступа к оплате',
  },
  {
    id: 'manager',
    icon: <HiWrenchScrewdriver className="h-5 w-5" aria-hidden />,
    title: 'Менеджер',
    subtitle: 'Расписание, подтверждение записей и работа с клиентами',
  },
  {
    id: 'staff',
    icon: <HiUserPlus className="h-5 w-5" aria-hidden />,
    title: 'Сотрудник',
    subtitle: 'Свои записи и ограниченный просмотр кабинета',
  },
] as const;

const TEAM_FEATURES = [
  {
    icon: <HiEnvelope className="h-5 w-5" aria-hidden />,
    title: 'Приглашения по email',
    subtitle: 'Отправляйте ссылку сотруднику — он подключится к вашему кабинету',
  },
  {
    icon: <HiShieldCheck className="h-5 w-5" aria-hidden />,
    title: 'Права по разделам',
    subtitle: 'Записи, клиенты, услуги, аналитика и настройки — отдельно для каждой роли',
  },
  {
    icon: <HiClipboardDocumentList className="h-5 w-5" aria-hidden />,
    title: 'История действий',
    subtitle: 'Кто изменил запись, услугу или настройку — с датой и временем',
  },
] as const;

export function SettingsTeamPage() {
  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={`${settingsCabinetStack} pb-8`}>
        <SettingsCabinetHero
          badge={
            <SettingsCabinetRingBadge current={TEAM_READY} total={TEAM_TOTAL} label="готово" />
          }
          title="Команда в одном кабинете"
          description="Приглашайте администраторов и сотрудников, разделяйте доступ к записям и настройкам."
        />

        <SettingsCabinetProgressCard
          eyebrow="В разработке"
          title="Скоро откроем доступ для команды"
          description="Сейчас кабинет рассчитан на одного мастера. Мультиаккаунт и роли появятся в одном из ближайших обновлений."
          percent={0}
        />

        <section>
          <SettingsCabinetSectionTitle
            title="Роли команды"
            description="Как будет устроен доступ — пока доступна только роль владельца"
          />
          <SettingsCabinetList>
            {TEAM_ROLES.map((role) => (
              <SettingsCabinetListRow
                key={role.id}
                icon={role.icon}
                iconTone="brand"
                title={role.title}
                subtitle={role.subtitle}
                disabled={role.id !== 'owner'}
                badge="Скоро"
                trailing={
                  role.id === 'owner' ? (
                    <SettingsCabinetStatusPill tone="success">Вы</SettingsCabinetStatusPill>
                  ) : undefined
                }
              />
            ))}
          </SettingsCabinetList>
        </section>

        <section>
          <SettingsCabinetSectionTitle
            title="Что будет доступно"
            description="Функции, которые мы готовим для тарифа Pro и салонов"
          />
          <div className="space-y-3">
            {TEAM_FEATURES.map((item) => (
              <SettingsCabinetFeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                badge={<SettingsCabinetStatusPill tone="pink">Скоро</SettingsCabinetStatusPill>}
              />
            ))}
          </div>
        </section>

        <section>
          <SettingsCabinetFeatureCard
            icon={<HiUserGroup className="h-5 w-5" aria-hidden />}
            title="Нужно раньше?"
            subtitle="Если команде уже нужен общий доступ — напишите в поддержку, учтём приоритет разработки."
          >
            <div className="flex flex-wrap gap-2">
              <Link
                to={MASTER_SETTINGS_SUPPORT_CONTACT_PATH}
                className={`inline-flex min-h-11 items-center justify-center ${settingsCabinetOutlineBtn} w-full sm:w-auto`}
              >
                Написать в поддержку
              </Link>
              <button
                type="button"
                disabled
                className={`${settingsCabinetOutlineBtn} w-full cursor-not-allowed opacity-50 sm:w-auto`}
              >
                Пригласить сотрудника
              </button>
            </div>
          </SettingsCabinetFeatureCard>
        </section>
      </div>
    </>
  );
}
