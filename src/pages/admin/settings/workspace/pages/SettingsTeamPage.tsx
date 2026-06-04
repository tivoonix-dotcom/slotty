import { SettingsHeader } from '../SettingsHeader';
import { SettingsPlaceholderPage } from '../settingsCards';
import { SETTINGS_PAGE_META } from '../settingsNav';

const meta = SETTINGS_PAGE_META.team;

export function SettingsTeamPage() {
  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <SettingsPlaceholderPage
        badge="В разработке"
        title="Команда и доступ"
        description="Скоро здесь можно будет приглашать сотрудников, администраторов и менеджеров."
        features={[
          'Приглашения по email',
          'Роли: администратор, менеджер, мастер',
          'Права доступа по разделам',
          'История действий команды',
        ]}
      />
    </>
  );
}
