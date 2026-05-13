import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { AdminBillingTab } from './AdminBillingTab';

export function AdminBillingSection() {
  return (
    <AdminSectionLayout
      title="Мой тариф"
      subtitle="Тарифы и лимиты в демо-режиме. Реальная оплата будет подключена позже."
    >
      <AdminBillingTab />
    </AdminSectionLayout>
  );
}
