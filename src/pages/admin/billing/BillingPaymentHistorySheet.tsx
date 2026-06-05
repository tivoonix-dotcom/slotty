import type { BillingPaymentDto } from '../../../features/billing/api/masterBillingApi';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import { BillingPaymentHistory } from './BillingPaymentHistory';

type Props = {
  open: boolean;
  onClose: () => void;
  payments: BillingPaymentDto[];
  loading?: boolean;
  onView: (payment: BillingPaymentDto) => void;
};

export function BillingPaymentHistorySheet({
  open,
  onClose,
  payments,
  loading,
  onView,
}: Props) {
  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="История платежей"
      subtitle="Списания по подписке Master Pro"
      variant="catalog"
      footer={
        <button type="button" className={catalogSheetSecondaryBtn} onClick={onClose}>
          Закрыть
        </button>
      }
    >
      <BillingPaymentHistory
        payments={payments}
        loading={loading}
        onView={onView}
        embedded
      />
    </AdminBottomSheet>
  );
}
