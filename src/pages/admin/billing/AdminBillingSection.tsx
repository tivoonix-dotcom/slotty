import { BILLING_PAGE_BG } from './adminBillingTheme';
import { AdminBillingTab } from './AdminBillingTab';

export function AdminBillingSection() {
  return (
    <div className={`mx-auto w-full min-w-0 max-w-6xl pb-10 pt-1 lg:pt-2 ${BILLING_PAGE_BG} lg:bg-transparent lg:px-0`}>
      <AdminBillingTab />
    </div>
  );
}
