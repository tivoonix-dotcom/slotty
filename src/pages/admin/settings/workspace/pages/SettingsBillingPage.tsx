import { AdminBillingTab } from '../../../billing/AdminBillingTab';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';

const meta = SETTINGS_PAGE_META.billing;

export function SettingsBillingPage() {
  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <div className="-mx-2 min-w-0 sm:mx-0">
        <AdminBillingTab />
      </div>
    </>
  );
}
